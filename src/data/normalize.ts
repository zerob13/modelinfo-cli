import type {
  NormalizeResult,
  NormalizedModel,
  NormalizedProvider,
  RawDataset,
  RawModel,
  RawProvider,
  UnknownRecord,
} from "./types.js";
import { toNumber } from "../utils/numbers.js";
import { stringArrayFromUnknown, toNonEmptyString, uniqueStrings, isRecord } from "../utils/strings.js";
import { toTimestamp } from "../utils/time.js";

function asRecord(value: unknown): UnknownRecord | undefined {
  return isRecord(value) ? value : undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1", "supported"].includes(normalized)) {
      return true;
    }

    if (["false", "no", "0", "unsupported"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function toDisplayString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
}

function normalizeMetadataArray(value: unknown): string[] {
  return stringArrayFromUnknown(value);
}

function normalizeModalities(
  rawModalities: unknown,
  metadata: UnknownRecord | undefined,
): { input: string[]; output: string[] } {
  const modalities = asRecord(rawModalities);
  const metadataModalities = asRecord(metadata?.modalities);

  const input = uniqueStrings([
    ...stringArrayFromUnknown(modalities?.input),
    ...stringArrayFromUnknown(metadata?.inputModalities),
    ...stringArrayFromUnknown(metadataModalities?.input),
  ]);

  const output = uniqueStrings([
    ...stringArrayFromUnknown(modalities?.output),
    ...stringArrayFromUnknown(metadataModalities?.output),
  ]);

  return { input, output };
}

function normalizeProvider(rawProvider: RawProvider, fallbackId: string): NormalizedProvider {
  const id = toNonEmptyString(rawProvider.id) ?? fallbackId;

  return {
    id,
    api: toNonEmptyString(rawProvider.api),
    name: toNonEmptyString(rawProvider.name),
    doc: toNonEmptyString(rawProvider.doc),
    display_name: toNonEmptyString(rawProvider.display_name),
    metadata: asRecord(rawProvider.metadata),
    model_count: Array.isArray(rawProvider.models) ? rawProvider.models.length : 0,
    raw: rawProvider,
  };
}

function normalizeModel(
  rawModel: RawModel,
  provider: NormalizedProvider,
  fallbackIndex: number,
): NormalizedModel {
  const metadata = asRecord(rawModel.metadata);
  const reasoning = asRecord(rawModel.reasoning);
  const cost = asRecord(rawModel.cost);
  const limit = asRecord(rawModel.limit);
  const metadataPricing = asRecord(metadata?.pricing);
  const { input, output } = normalizeModalities(rawModel.modalities, metadata);
  const explicitVision = toBoolean(rawModel.vision);
  const derivedVision = input.some((item) => item === "image" || item === "video");

  return {
    provider_id: provider.id,
    provider_name: provider.name,
    provider_display_name: provider.display_name,
    provider_api: provider.api,
    provider_doc: provider.doc,
    model_id:
      toNonEmptyString(rawModel.id) ??
      toNonEmptyString(rawModel.display_name) ??
      toNonEmptyString(rawModel.name) ??
      `${provider.id}#${fallbackIndex}`,
    model_name: toNonEmptyString(rawModel.name),
    model_display_name: toNonEmptyString(rawModel.display_name),
    type: toNonEmptyString(rawModel.type),
    attachment: toBoolean(rawModel.attachment),
    reasoning_supported: toBoolean(reasoning?.supported),
    reasoning_default: toBoolean(reasoning?.default),
    tool_call: toBoolean(rawModel.tool_call),
    temperature: toBoolean(rawModel.temperature),
    vision: explicitVision ?? (input.length > 0 ? derivedVision : undefined),
    open_weights: toBoolean(rawModel.open_weights),
    knowledge: toDisplayString(rawModel.knowledge),
    release_date: toDisplayString(rawModel.release_date),
    last_updated: toDisplayString(rawModel.last_updated),
    input_modalities: input,
    output_modalities: output,
    cost_input: toNumber(cost?.input) ?? toNumber(metadataPricing?.input),
    cost_output: toNumber(cost?.output) ?? toNumber(metadataPricing?.output),
    cost_cache_read:
      toNumber(cost?.cache_read) ?? toNumber(metadataPricing?.cache_read) ?? toNumber(rawModel.cache_read),
    context_limit: toNumber(limit?.context) ?? toNumber(limit?.input),
    output_limit: toNumber(limit?.output),
    metadata_description: toDisplayString(metadata?.description),
    metadata_features: normalizeMetadataArray(metadata?.features ?? rawModel.features),
    metadata_type_hints: normalizeMetadataArray(metadata?.typeHints ?? rawModel.typeHints),
    raw: rawModel,
  };
}

export function normalizeDataset(dataset: RawDataset): NormalizeResult {
  const sourceUpdatedAt = Array.isArray(dataset) ? undefined : toTimestamp(dataset.updated_at);
  const rawProviders: Array<{ key: string; provider: RawProvider }> = [];

  if (Array.isArray(dataset)) {
    dataset.forEach((provider, index) => {
      rawProviders.push({
        key: toNonEmptyString(provider.id) ?? `provider-${index + 1}`,
        provider,
      });
    });
  } else if (Array.isArray(dataset.providers)) {
    dataset.providers.forEach((provider, index) => {
      rawProviders.push({
        key: toNonEmptyString(provider.id) ?? `provider-${index + 1}`,
        provider,
      });
    });
  } else {
    for (const [key, provider] of Object.entries(dataset.providers)) {
      if (isRecord(provider)) {
        rawProviders.push({ key, provider });
      }
    }
  }

  const providers: NormalizedProvider[] = [];
  const models: NormalizedModel[] = [];

  for (const { key, provider: rawProvider } of rawProviders) {
    const provider = normalizeProvider(rawProvider, key);
    providers.push(provider);

    const rawModels = Array.isArray(rawProvider.models) ? rawProvider.models : [];
    rawModels.forEach((rawModel, index) => {
      if (!isRecord(rawModel)) {
        return;
      }

      models.push(normalizeModel(rawModel as RawModel, provider, index + 1));
    });
  }

  return {
    providers,
    models,
    source_updated_at: sourceUpdatedAt,
  };
}
