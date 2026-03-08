import { getCachePaths } from "../core/config.js";
import { syncCacheFromRemote } from "../data/remote.js";
import { updateToJson, writeJson, type OutputFormat } from "../format/json.js";
import { formatTimestamp } from "../utils/time.js";

export async function runUpdateCommand(options?: { output?: OutputFormat }): Promise<void> {
  const result = await syncCacheFromRemote(getCachePaths());
  if (options?.output === "json") {
    writeJson(updateToJson(result));
    return;
  }

  const lines = [
    "Update Summary",
    `  Updated       : ${result.updated ? "yes" : "no"}`,
    `  Old Version   : ${formatTimestamp(result.old_version)}`,
    `  New Version   : ${formatTimestamp(result.new_version)}`,
    `  Providers     : ${result.provider_count}`,
    `  Models        : ${result.model_count}`,
    `  Cache Origin  : ${result.cache_origin}`,
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
}
