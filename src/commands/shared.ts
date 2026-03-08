import { resolveModelCandidates, resolveProviderCandidates, pickStrongModelMatch } from "../data/index.js";
import { ensureRuntimeIndex } from "../data/remote.js";
import type { IndexDocument, IndexedModel, IndexedProvider, RankedModelMatch, RankedProviderMatch } from "../data/types.js";

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

export async function resolveModelQuery(query: string, provider?: string): Promise<ModelResolution> {
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
