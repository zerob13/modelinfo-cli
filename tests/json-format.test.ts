import { describe, expect, test } from "vitest";

import { modelToJson } from "../src/format/json.js";

describe("json output", () => {
  test("does not expose internal search helpers", () => {
    const result = modelToJson({
      provider_id: "openai",
      provider_name: "OpenAI",
      provider_display_name: "OpenAI",
      provider_api: undefined,
      provider_doc: undefined,
      model_id: "gpt-4o",
      model_name: "GPT-4o",
      model_display_name: "GPT-4o",
      type: "chat",
      attachment: true,
      reasoning_supported: false,
      reasoning_default: undefined,
      tool_call: true,
      temperature: true,
      vision: true,
      open_weights: false,
      knowledge: "2023-09",
      release_date: "2024-05-13",
      last_updated: "2024-08-06",
      input_modalities: ["text", "image"],
      output_modalities: ["text"],
      cost_input: 2.5,
      cost_output: 10,
      cost_cache_read: 1.25,
      context_limit: 128000,
      output_limit: 16384,
      metadata_description: undefined,
      metadata_features: [],
      metadata_type_hints: [],
      raw: { id: "gpt-4o" },
      search_text: "gpt-4o openai",
      search_tokens: ["gpt-4o", "openai"],
    });

    expect(result).not.toHaveProperty("search_text");
    expect(result).not.toHaveProperty("search_tokens");
    expect(result.model_id).toBe("gpt-4o");
  });
});
