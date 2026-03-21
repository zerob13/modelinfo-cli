import { ModelinfoError } from "../core/errors.js";
import { modelMatchToJson, writeJson, type OutputFormat } from "../format/json.js";
import { renderModelMatchesTable } from "../format/table.js";
import {
  resolveModelCandidates,
  resolveProviderCandidates,
  pickStrongModelMatch,
} from "../data/index.js";
import { ensureRuntimeIndex } from "../data/remote.js";
import type {
  IndexDocument,
  IndexedModel,
  IndexedProvider,
  RankedModelMatch,
  RankedProviderMatch,
} from "../data/types.js";

export interface ModelResolution {
  index: IndexDocument;
  matches: RankedModelMatch[];
  single?: RankedModelMatch;
}

export interface ProviderResolution {
  index: IndexDocument;
  matches: RankedProviderMatch[];
  single?: RankedProviderMatch;
}

function pickStrongProviderMatch(matches: RankedProviderMatch[]): RankedProviderMatch | undefined {
  if (matches.length === 0) {
    return undefined;
  }

  if (matches.length === 1) {
    return matches[0];
  }

  const [first, second] = matches;
  if (first && second && first.reason === "exact-name" && second.reason !== "exact-name") {
    return first;
  }

  return undefined;
}

export async function resolveModelQuery(
  query: string,
  provider?: string,
): Promise<ModelResolution> {
  const { index } = await ensureRuntimeIndex();
  const matches = resolveModelCandidates(index, query, { provider });

  return {
    index,
    matches,
    single: pickStrongModelMatch(matches),
  };
}

export async function resolveProviderQuery(query: string): Promise<ProviderResolution> {
  const { index } = await ensureRuntimeIndex();
  const matches = resolveProviderCandidates(index, query);

  return {
    index,
    matches,
    single: pickStrongProviderMatch(matches),
  };
}

export function requireSingleModel(resolution: ModelResolution): IndexedModel | undefined {
  return resolution.single?.model;
}

export function requireSingleProvider(resolution: ProviderResolution): IndexedProvider | undefined {
  return resolution.single?.provider;
}

// ============================================================================
// Single Model Command Handler (Refactored from caps/cost/limit)
// ============================================================================

/**
 * Handler interface for single-model commands (caps, cost, limit).
 * Each command provides its own JSON serializer and detail renderer.
 */
export interface SingleModelHandler<T = unknown> {
  /** Convert model to JSON output format */
  toJson: (model: IndexedModel) => T;
  /** Render model details as string for table output */
  renderDetail: (model: IndexedModel) => string;
  /** Command name for error messages (optional, for future use) */
  commandName?: string;
}

/**
 * Execute a single-model command with unified error handling.
 * Used by caps, cost, and limit commands to reduce code duplication.
 */
export async function runSingleModelCommand<T>(
  modelQuery: string,
  options: { provider?: string; output?: OutputFormat },
  handler: SingleModelHandler<T>,
): Promise<void> {
  const resolution = await resolveModelQuery(modelQuery, options.provider);
  const model = requireSingleModel(resolution);

  if (!model) {
    handleModelNotFound(resolution, modelQuery, options.output);
    return;
  }

  if (options.output === "json") {
    writeJson(handler.toJson(model));
    return;
  }

  process.stdout.write(`${handler.renderDetail(model)}\n`);
}

/**
 * Handle model not found scenarios (no match or multiple matches).
 */
function handleModelNotFound(
  resolution: ModelResolution,
  query: string,
  output?: OutputFormat,
): void {
  // No matches at all
  if (resolution.matches.length === 0) {
    if (output === "json") {
      writeJson({ error: "MODEL_NOT_FOUND", query });
      process.exitCode = 1;
      return;
    }
    throw new ModelinfoError(`No model matched "${query}".`, "MODEL_NOT_FOUND");
  }

  // Multiple matches - show candidates
  if (output === "json") {
    writeJson({
      query,
      count: resolution.matches.length,
      results: resolution.matches.map(modelMatchToJson),
    });
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${renderModelMatchesTable(resolution.matches, { includeReason: true })}\n`);
  process.exitCode = 1;
}
