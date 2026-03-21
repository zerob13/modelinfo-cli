import { capsToJson, type OutputFormat } from "../format/json.js";
import { renderCapsDetail } from "../format/detail.js";
import { runSingleModelCommand } from "./shared.js";

export async function runCapsCommand(
  modelQuery: string,
  options?: { provider?: string; output?: OutputFormat },
): Promise<void> {
  await runSingleModelCommand(modelQuery, options ?? {}, {
    toJson: capsToJson,
    renderDetail: renderCapsDetail,
    commandName: "caps",
  });
}
