import { ModelinfoError } from "../core/errors.js";
import { renderDiffTable, renderModelMatchesTable } from "../format/table.js";
import { resolveModelQuery, requireSingleModel } from "./shared.js";

export async function runDiffCommand(
  modelAQuery: string,
  modelBQuery: string,
  options?: { providerA?: string; providerB?: string },
): Promise<void> {
  const leftResolution = await resolveModelQuery(modelAQuery, options?.providerA);
  const rightResolution = await resolveModelQuery(modelBQuery, options?.providerB);
  const left = requireSingleModel(leftResolution);
  const right = requireSingleModel(rightResolution);

  if (!left) {
    if (leftResolution.matches.length === 0) {
      throw new ModelinfoError(`No model matched "${modelAQuery}".`, "MODEL_NOT_FOUND");
    }

    process.stdout.write(`Left candidates\n${renderModelMatchesTable(leftResolution.matches, { includeReason: true })}\n`);
    process.exitCode = 1;
    return;
  }

  if (!right) {
    if (rightResolution.matches.length === 0) {
      throw new ModelinfoError(`No model matched "${modelBQuery}".`, "MODEL_NOT_FOUND");
    }

    process.stdout.write(`Right candidates\n${renderModelMatchesTable(rightResolution.matches, { includeReason: true })}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${renderDiffTable(left, right)}\n`);
}
