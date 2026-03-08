import { ModelinfoError } from "../core/errors.js";
import { renderModelDetail } from "../format/detail.js";
import { renderModelMatchesTable } from "../format/table.js";
import { resolveModelQuery, requireSingleModel } from "./shared.js";

export async function runShowCommand(modelQuery: string, options?: { provider?: string }): Promise<void> {
  const resolution = await resolveModelQuery(modelQuery, options?.provider);
  const model = requireSingleModel(resolution);

  if (model) {
    process.stdout.write(`${renderModelDetail(model)}\n`);
    return;
  }

  if (resolution.matches.length === 0) {
    throw new ModelinfoError(`No model matched "${modelQuery}".`, "MODEL_NOT_FOUND");
  }

  process.stdout.write(`${renderModelMatchesTable(resolution.matches, { includeReason: true })}\n`);
}
