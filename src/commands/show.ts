import { ModelinfoError } from "../core/errors.js";
import { writeJson, modelMatchToJson, modelToJson, type OutputFormat } from "../format/json.js";
import { renderModelDetail } from "../format/detail.js";
import { renderModelMatchesTable } from "../format/table.js";
import { resolveModelQuery, requireSingleModel } from "./shared.js";

export async function runShowCommand(
  modelQuery: string,
  options?: { provider?: string; output?: OutputFormat },
): Promise<void> {
  const resolution = await resolveModelQuery(modelQuery, options?.provider);
  const model = requireSingleModel(resolution);

  if (model) {
    if (options?.output === "json") {
      writeJson(modelToJson(model));
      return;
    }

    process.stdout.write(`${renderModelDetail(model)}\n`);
    return;
  }

  if (resolution.matches.length === 0) {
    if (options?.output === "json") {
      writeJson({ error: "MODEL_NOT_FOUND", query: modelQuery });
      process.exitCode = 1;
      return;
    }

    throw new ModelinfoError(`No model matched "${modelQuery}".`, "MODEL_NOT_FOUND");
  }

  if (options?.output === "json") {
    writeJson({
      query: modelQuery,
      count: resolution.matches.length,
      results: resolution.matches.map(modelMatchToJson),
    });
    return;
  }

  process.stdout.write(`${renderModelMatchesTable(resolution.matches, { includeReason: true })}\n`);
}
