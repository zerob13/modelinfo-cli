import { ModelinfoError } from "../core/errors.js";
import { renderLimitDetail } from "../format/detail.js";
import { renderModelMatchesTable } from "../format/table.js";
import { requireSingleModel, resolveModelQuery } from "./shared.js";

export async function runLimitCommand(modelQuery: string, options?: { provider?: string }): Promise<void> {
  const resolution = await resolveModelQuery(modelQuery, options?.provider);
  const model = requireSingleModel(resolution);

  if (!model) {
    if (resolution.matches.length === 0) {
      throw new ModelinfoError(`No model matched "${modelQuery}".`, "MODEL_NOT_FOUND");
    }

    process.stdout.write(`${renderModelMatchesTable(resolution.matches, { includeReason: true })}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${renderLimitDetail(model)}\n`);
}
