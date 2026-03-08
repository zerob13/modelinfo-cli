import Fuse from "fuse.js";

import type { IndexedModel } from "../data/types.js";

export function createModelFuse(models: IndexedModel[]): Fuse<IndexedModel> {
  return new Fuse(models, {
    includeScore: true,
    shouldSort: true,
    ignoreLocation: true,
    threshold: 0.35,
    minMatchCharLength: 2,
    keys: [
      { name: "model_id", weight: 0.4 },
      { name: "model_name", weight: 0.2 },
      { name: "model_display_name", weight: 0.2 },
      { name: "provider_id", weight: 0.1 },
      { name: "provider_name", weight: 0.05 },
      { name: "provider_display_name", weight: 0.05 },
      { name: "search_tokens", weight: 0.15 },
    ],
  });
}
