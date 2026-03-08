import { ModelinfoError } from "../core/errors.js";
import { renderLimitDetail } from "../format/detail.js";
import { limitToJson, modelMatchToJson, writeJson, type OutputFormat } from "../format/json.js";
import { renderModelMatchesTable } from "../format/table.js";
import { requireSingleModel, resolveModelQuery } from "./shared.js";

export async function runLimitCommand(
  modelQuery: string,
  options?: { provider?: string; output?: OutputFormat },
): Promise<void> {
  const resolution = await resolveModelQuery(modelQuery, options?.provider);
  const model = requireSingleModel(resolution);

  if (!model) {
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
      process.exitCode = 1;
      return;
    }

    process.stdout.write(
      `${renderModelMatchesTable(resolution.matches, { includeReason: true })}\n`,
    );
    process.exitCode = 1;
    return;
  }

  if (options?.output === "json") {
    writeJson(limitToJson(model));
    return;
  }

  process.stdout.write(`${renderLimitDetail(model)}\n`);
}
