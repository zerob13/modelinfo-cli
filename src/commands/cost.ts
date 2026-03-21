import { costToJson, type OutputFormat } from "../format/json.js";
import { renderCostDetail } from "../format/detail.js";
import { runSingleModelCommand } from "./shared.js";

export async function runCostCommand(
  modelQuery: string,
  options?: { provider?: string; output?: OutputFormat },
): Promise<void> {
  await runSingleModelCommand(modelQuery, options ?? {}, {
    toJson: costToJson,
    renderDetail: renderCostDetail,
    commandName: "cost",
  });
}
