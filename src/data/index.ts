import type {
  IndexDocument,
  IndexedModel,
  IndexedProvider,
  IndexLookup,
  MatchReason,
  NormalizeResult,
  RankedModelMatch,
  RankedProviderMatch,
} from "./types.js";
import { INDEX_SCHEMA_VERSION } from "../core/config.js";
import { buildSortScore, compareModelMatches, compareProviderMatches } from "../search/rank.js";
import { createModelFuse } from "../search/fuzzy.js";
import { normalizeNeedle, toNonEmptyString, uniqueStrings } from "../utils/strings.js";

function createEmptyLookup(): IndexLookup {
  return {
    by_model_id: {},
    by_display_name: {},
    by_name: {},
    by_provider_id: {},
    by_provider_name: {},
    by_provider_display_name: {},
  };
}

function addLookup(map: Record<string, number[]>, key: string | undefined, index: number): void {
  const normalized = key ? normalizeNeedle(key) : undefined;
  if (!normalized) {
    return;
  }

  const bucket = map[normalized] ?? [];
  bucket.push(index);
  map[normalized] = bucket;
}

function buildProviderTokens(provider: NormalizeResult["providers"][number]): string[] {
  return uniqueStrings([provider.id, provider.name, provider.display_name]);
}

function buildModelTokens(model: NormalizeResult["models"][number]): string[] {
  return uniqueStrings([
    model.model_id,
    model.model_name,
    model.model_display_name,
    model.provider_id,
    model.provider_name,
    model.provider_display_name,
    ...model.input_modalities,
    ...model.output_modalities,
    ...model.metadata_features,
    ...model.metadata_type_hints,
  ]).map((value) => value.toLowerCase());
}

export function buildIndexDocument(normalized: NormalizeResult, generatedAt = Date.now()): IndexDocument {
  const providers: IndexedProvider[] = normalized.providers.map((provider) => {
    const searchTokens = buildProviderTokens(provider).map((value) => value.toLowerCase());

    return {
      ...provider,
      search_tokens: searchTokens,
      search_text: searchTokens.join(" "),
    };
  });

  const models: IndexedModel[] = normalized.models.map((model) => {
    const searchTokens = buildModelTokens(model);

    return {
      ...model,
      search_tokens: searchTokens,
      search_text: searchTokens.join(" "),
    };
  });

  const lookup = createEmptyLookup();

  models.forEach((model, index) => {
    addLookup(lookup.by_model_id, model.model_id, index);
    addLookup(lookup.by_display_name, model.model_display_name, index);
    addLookup(lookup.by_name, model.model_name, index);
    addLookup(lookup.by_provider_id, model.provider_id, index);
    addLookup(lookup.by_provider_name, model.provider_name, index);
    addLookup(lookup.by_provider_display_name, model.provider_display_name, index);
  });

  return {
    schema_version: INDEX_SCHEMA_VERSION,
    source_updated_at: normalized.source_updated_at,
    generated_at: generatedAt,
    provider_count: providers.length,
    model_count: models.length,
    providers,
    models,
    lookup,
  };
}

function pushModelMatch(
  target: Map<number, RankedModelMatch>,
  index: number,
  model: IndexedModel,
  reason: MatchReason,
  tieBreaker: number,
  fuzzyScore?: number,
): void {
  const next: RankedModelMatch = {
    model,
    index,
    reason,
    fuzzy_score: fuzzyScore,
    sort_score: buildSortScore(reason, tieBreaker, fuzzyScore),
  };

  const current = target.get(index);
  if (!current || compareModelMatches(next, current) < 0) {
    target.set(index, next);
  }
}

function pushProviderMatch(
  target: Map<string, RankedProviderMatch>,
  provider: IndexedProvider,
  reason: RankedProviderMatch["reason"],
  tieBreaker: number,
): void {
  const next: RankedProviderMatch = {
    provider,
    reason,
    sort_score: buildSortScore(reason, tieBreaker),
  };

  const current = target.get(provider.id);
  if (!current || compareProviderMatches(next, current) < 0) {
    target.set(provider.id, next);
  }
}

function maybeMatchField(
  field: string | undefined,
  needle: string,
  exactReason: MatchReason,
): { reason: MatchReason; tieBreaker: number } | undefined {
  const normalized = field ? normalizeNeedle(field) : undefined;
  if (!normalized) {
    return undefined;
  }

  if (normalized === needle) {
    return { reason: exactReason, tieBreaker: normalized.length / 1000 };
  }

  if (normalized.startsWith(needle)) {
    return { reason: "prefix", tieBreaker: normalized.length / 1000 };
  }

  if (normalized.includes(needle)) {
    return { reason: "substring", tieBreaker: normalized.length / 1000 };
  }

  return undefined;
}

function collectProviderFilterIds(indexDocument: IndexDocument, providerFilter?: string): Set<string> | undefined {
  if (!providerFilter) {
    return undefined;
  }

  const providerMatches = searchProviders(indexDocument, providerFilter);
  if (providerMatches.length === 0) {
    return new Set<string>();
  }

  return new Set(providerMatches.map((match) => match.provider.id));
}

export function searchProviders(indexDocument: IndexDocument, keyword: string): RankedProviderMatch[] {
  const needle = normalizeNeedle(keyword);
  if (!needle) {
    return [];
  }

  const matches = new Map<string, RankedProviderMatch>();

  for (const provider of indexDocument.providers) {
    const candidates: Array<{ reason: RankedProviderMatch["reason"]; tieBreaker: number }> = [];

    for (const field of [provider.id, provider.display_name, provider.name]) {
      const match = maybeMatchField(field, needle, "exact-name");
      if (match) {
        candidates.push({ reason: match.reason as RankedProviderMatch["reason"], tieBreaker: match.tieBreaker });
      }
    }

    candidates.sort((left, right) => buildSortScore(left.reason, left.tieBreaker) - buildSortScore(right.reason, right.tieBreaker));
    const best = candidates[0];
    if (best) {
      pushProviderMatch(matches, provider, best.reason, best.tieBreaker);
    }
  }

  return [...matches.values()].sort(compareProviderMatches);
}

function applyFuzzyMatches(
  indexDocument: IndexDocument,
  keyword: string,
  matches: Map<number, RankedModelMatch>,
  providerFilterIds?: Set<string>,
): void {
  const fuse = createModelFuse(indexDocument.models);
  const fuzzyMatches = fuse.search(keyword);

  for (const fuzzyMatch of fuzzyMatches) {
    const model = fuzzyMatch.item;
    if (providerFilterIds && !providerFilterIds.has(model.provider_id)) {
      continue;
    }

    pushModelMatch(
      matches,
      fuzzyMatch.refIndex,
      model,
      "fuzzy",
      (fuzzyMatch.score ?? 0) * 10,
      fuzzyMatch.score,
    );
  }
}

function rankModelMatches(
  indexDocument: IndexDocument,
  keyword: string,
  options: {
    includeProviderFields: boolean;
    providerFilter?: string;
  },
): RankedModelMatch[] {
  const needle = normalizeNeedle(keyword);
  if (!needle) {
    return [];
  }

  const providerFilterIds = collectProviderFilterIds(indexDocument, options.providerFilter);
  if (providerFilterIds && providerFilterIds.size === 0) {
    return [];
  }

  const matches = new Map<number, RankedModelMatch>();

  indexDocument.models.forEach((model, index) => {
    if (providerFilterIds && !providerFilterIds.has(model.provider_id)) {
      return;
    }

    const fields: Array<{ value: string | undefined; reason: MatchReason }> = [
      { value: model.model_id, reason: "exact-model-id" },
      { value: model.model_display_name, reason: "exact-display-name" },
      { value: model.model_name, reason: "exact-name" },
    ];

    if (options.includeProviderFields) {
      fields.push(
        { value: model.provider_id, reason: "exact-name" },
        { value: model.provider_display_name, reason: "exact-name" },
        { value: model.provider_name, reason: "exact-name" },
      );
    }

    const bestMatches = fields
      .map((field) => maybeMatchField(field.value, needle, field.reason))
      .filter((value): value is { reason: MatchReason; tieBreaker: number } => Boolean(value))
      .sort((left, right) => buildSortScore(left.reason, left.tieBreaker) - buildSortScore(right.reason, right.tieBreaker));

    const best = bestMatches[0];
    if (best) {
      pushModelMatch(matches, index, model, best.reason, best.tieBreaker);
      return;
    }

    if (model.search_text.includes(needle)) {
      pushModelMatch(matches, index, model, "substring", model.search_text.length / 1000);
    }
  });

  applyFuzzyMatches(indexDocument, keyword, matches, providerFilterIds);
  return [...matches.values()].sort(compareModelMatches);
}

export function searchModels(
  indexDocument: IndexDocument,
  keyword: string,
  options?: { provider?: string },
): RankedModelMatch[] {
  return rankModelMatches(indexDocument, keyword, {
    includeProviderFields: true,
    providerFilter: options?.provider,
  });
}

export function resolveModelCandidates(
  indexDocument: IndexDocument,
  keyword: string,
  options?: { provider?: string },
): RankedModelMatch[] {
  return rankModelMatches(indexDocument, keyword, {
    includeProviderFields: false,
    providerFilter: options?.provider,
  });
}

export function pickStrongModelMatch(matches: RankedModelMatch[]): RankedModelMatch | undefined {
  if (matches.length === 0) {
    return undefined;
  }

  if (matches.length === 1) {
    return matches[0];
  }

  const first = matches[0];
  const second = matches[1];
  if (!first || !second) {
    return first;
  }

  const exactReasons: MatchReason[] = ["exact-model-id", "exact-display-name", "exact-name"];
  if (exactReasons.includes(first.reason) && first.reason !== second.reason) {
    return first;
  }

  return undefined;
}

export function resolveProviderCandidates(indexDocument: IndexDocument, keyword: string): RankedProviderMatch[] {
  return searchProviders(indexDocument, keyword);
}

export function getModelsForProvider(indexDocument: IndexDocument, providerId: string): IndexedModel[] {
  const needle = normalizeNeedle(providerId);

  return indexDocument.models.filter((model) => normalizeNeedle(model.provider_id) === needle);
}

export function collectKnownExtraFields(model: IndexedModel): Array<[label: string, value: string]> {
  const knownModelKeys = new Set([
    "id",
    "name",
    "display_name",
    "type",
    "attachment",
    "reasoning",
    "tool_call",
    "temperature",
    "vision",
    "open_weights",
    "knowledge",
    "release_date",
    "last_updated",
    "modalities",
    "cost",
    "limit",
    "metadata",
    "features",
    "typeHints",
  ]);
  const extras: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(model.raw)) {
    if (knownModelKeys.has(key)) {
      continue;
    }

    const rendered = toNonEmptyString(value) ?? JSON.stringify(value);
    if (rendered) {
      extras.push([key, rendered]);
    }
  }

  return extras;
}
