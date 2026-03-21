import { limitToJson, type OutputFormat } from "../format/json.js";
import { renderLimitDetail } from "../format/detail.js";
import { runSingleModelCommand } from "./shared.js";

export async function runLimitCommand(
  modelQuery: string,
  options?: { provider?: string; output?: OutputFormat },
): Promise<void> {
  await runSingleModelCommand(modelQuery, options ?? {}, {
    toJson: limitToJson,
    renderDetail: renderLimitDetail,
    commandName: "limit",
  });
}
