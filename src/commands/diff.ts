import { ModelinfoError } from "../core/errors.js";
import { diffToJson, modelMatchToJson, writeJson, type OutputFormat } from "../format/json.js";
import { renderDiffTable, renderModelMatchesTable } from "../format/table.js";
import { resolveModelQuery, requireSingleModel } from "./shared.js";

export async function runDiffCommand(
  modelAQuery: string,
  modelBQuery: string,
  options?: { providerA?: string; providerB?: string; output?: OutputFormat },
): Promise<void> {
  const leftResolution = await resolveModelQuery(modelAQuery, options?.providerA);
  const rightResolution = await resolveModelQuery(modelBQuery, options?.providerB);
  const left = requireSingleModel(leftResolution);
  const right = requireSingleModel(rightResolution);

  if (!left) {
    if (leftResolution.matches.length === 0) {
      if (options?.output === "json") {
        writeJson({ error: "MODEL_NOT_FOUND", side: "left", query: modelAQuery });
        process.exitCode = 1;
        return;
      }

      throw new ModelinfoError(`No model matched "${modelAQuery}".`, "MODEL_NOT_FOUND");
    }

    if (options?.output === "json") {
      writeJson({
        side: "left",
        query: modelAQuery,
        count: leftResolution.matches.length,
        results: leftResolution.matches.map(modelMatchToJson),
      });
      process.exitCode = 1;
      return;
    }

    process.stdout.write(
      `Left candidates\n${renderModelMatchesTable(leftResolution.matches, { includeReason: true })}\n`,
    );
    process.exitCode = 1;
    return;
  }

  if (!right) {
    if (rightResolution.matches.length === 0) {
      if (options?.output === "json") {
        writeJson({ error: "MODEL_NOT_FOUND", side: "right", query: modelBQuery });
        process.exitCode = 1;
        return;
      }

      throw new ModelinfoError(`No model matched "${modelBQuery}".`, "MODEL_NOT_FOUND");
    }

    if (options?.output === "json") {
      writeJson({
        side: "right",
        query: modelBQuery,
        count: rightResolution.matches.length,
        results: rightResolution.matches.map(modelMatchToJson),
      });
      process.exitCode = 1;
      return;
    }

    process.stdout.write(
      `Right candidates\n${renderModelMatchesTable(rightResolution.matches, { includeReason: true })}\n`,
    );
    process.exitCode = 1;
    return;
  }

  if (options?.output === "json") {
    writeJson(diffToJson(left, right));
    return;
  }

  process.stdout.write(`${renderDiffTable(left, right)}\n`);
}
