import { describe, expect, test } from "vitest";

import {
  buildIndexDocument,
  pickStrongModelMatch,
  resolveModelCandidates,
  searchModels,
} from "../src/data/index.js";
import { normalizeDataset } from "../src/data/normalize.js";

const dataset = {
  updated_at: 999,
  providers: {
    openai: {
      id: "openai",
      name: "OpenAI",
      display_name: "OpenAI",
      models: [
        {
          id: "gpt-4o",
          display_name: "GPT-4o",
          type: "chat",
          cost: { input: 2.5, output: 10 },
          limit: { context: 128000, output: 16000 },
        },
      ],
    },
    openrouter: {
      id: "openrouter",
      name: "OpenRouter",
      display_name: "OpenRouter",
      models: [
        {
          id: "gpt-4o",
          display_name: "GPT-4o",
          type: "chat",
          cost: { input: 3, output: 12 },
          limit: { context: 128000, output: 16000 },
        },
        {
          id: "qwen-max",
          display_name: "Qwen Max",
          type: "chat",
          cost: { input: 1, output: 2 },
          limit: { context: 64000, output: 8000 },
        },
      ],
    },
  },
};

describe("index queries", () => {
  test("does not treat duplicate model ids as unique", () => {
    const index = buildIndexDocument(normalizeDataset(dataset));
    const matches = resolveModelCandidates(index, "gpt-4o");

    expect(matches).toHaveLength(2);
    expect(pickStrongModelMatch(matches)).toBeUndefined();
  });

  test("applies provider filters to narrow model candidates", () => {
    const index = buildIndexDocument(normalizeDataset(dataset));
    const matches = resolveModelCandidates(index, "gpt-4o", { provider: "openai" });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.model.provider_id).toBe("openai");
  });

  test("searches provider fields as well", () => {
    const index = buildIndexDocument(normalizeDataset(dataset));
    const matches = searchModels(index, "openrouter");

    expect(matches).toHaveLength(2);
    expect(matches.every((match) => match.model.provider_id === "openrouter")).toBe(true);
  });
});
