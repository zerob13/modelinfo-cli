import type { MatchReason, RankedModelMatch, RankedProviderMatch } from "../data/types.js";

const REASON_WEIGHT: Record<MatchReason, number> = {
  "exact-model-id": 0,
  "exact-display-name": 10,
  "exact-name": 20,
  prefix: 30,
  substring: 40,
  fuzzy: 50,
};

export function buildSortScore(reason: MatchReason, tieBreaker = 0, fuzzyScore?: number): number {
  return REASON_WEIGHT[reason] + tieBreaker + (fuzzyScore ?? 0);
}

export function compareModelMatches(left: RankedModelMatch, right: RankedModelMatch): number {
  if (left.sort_score !== right.sort_score) {
    return left.sort_score - right.sort_score;
  }

  if ((left.fuzzy_score ?? 0) !== (right.fuzzy_score ?? 0)) {
    return (left.fuzzy_score ?? 0) - (right.fuzzy_score ?? 0);
  }

  const leftLabel = left.model.model_display_name ?? left.model.model_name ?? left.model.model_id;
  const rightLabel =
    right.model.model_display_name ?? right.model.model_name ?? right.model.model_id;

  return leftLabel.localeCompare(rightLabel);
}

export function compareProviderMatches(
  left: RankedProviderMatch,
  right: RankedProviderMatch,
): number {
  if (left.sort_score !== right.sort_score) {
    return left.sort_score - right.sort_score;
  }

  const leftLabel = left.provider.display_name ?? left.provider.name ?? left.provider.id;
  const rightLabel = right.provider.display_name ?? right.provider.name ?? right.provider.id;

  return leftLabel.localeCompare(rightLabel);
}

export function reasonLabel(reason: MatchReason): string {
  switch (reason) {
    case "exact-model-id":
      return "exact id";
    case "exact-display-name":
      return "exact display";
    case "exact-name":
      return "exact name";
    case "prefix":
      return "prefix";
    case "substring":
      return "partial";
    case "fuzzy":
      return "fuzzy";
  }
}
