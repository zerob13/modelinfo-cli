import { describe, expect, test } from "vitest";

import { normalizeDataset } from "../src/data/normalize.js";

describe("normalizeDataset", () => {
  test("normalizes provider maps and metadata fallbacks", () => {
    const result = normalizeDataset({
      updated_at: 12345,
      providers: {
        demo: {
          id: "demo",
          name: "Demo Provider",
          display_name: "Demo",
          api: "https://example.com",
          doc: "https://docs.example.com",
          models: [
            {
              id: "demo/model",
              display_name: "Demo Model",
              name: "demo-model",
              reasoning: { supported: true, default: false },
              tool_call: true,
              metadata: {
                features: ["tools", "vision"],
                typeHints: "chat",
                pricing: {
                  input: 1.2,
                  output: 3.4,
                  cache_read: 0.5,
                },
                inputModalities: ["text", "image"],
              },
              limit: {
                context: 128000,
                output: 4000,
              },
            },
          ],
        },
      },
    });

    expect(result.providers).toHaveLength(1);
    expect(result.models).toHaveLength(1);
    expect(result.source_updated_at).toBe(12345);

    const [model] = result.models;
    expect(model?.provider_id).toBe("demo");
    expect(model?.reasoning_supported).toBe(true);
    expect(model?.reasoning_default).toBe(false);
    expect(model?.cost_cache_read).toBe(0.5);
    expect(model?.input_modalities).toEqual(["text", "image"]);
    expect(model?.metadata_type_hints).toEqual(["chat"]);
  });
});
