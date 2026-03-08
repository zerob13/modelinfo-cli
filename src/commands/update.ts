import { getCachePaths } from "../core/config.js";
import { syncCacheFromRemote } from "../data/remote.js";
import { formatTimestamp } from "../utils/time.js";

export async function runUpdateCommand(): Promise<void> {
  const result = await syncCacheFromRemote(getCachePaths());
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
