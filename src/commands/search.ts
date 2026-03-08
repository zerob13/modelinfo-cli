import { searchModels } from "../data/index.js";
import { ensureRuntimeIndex } from "../data/remote.js";
import { modelMatchToJson, writeJson, type OutputFormat } from "../format/json.js";
import { renderModelMatchesTable } from "../format/table.js";

export async function runSearchCommand(
  keyword: string,
  options?: { provider?: string; limit?: number; output?: OutputFormat },
): Promise<void> {
  const { index } = await ensureRuntimeIndex();
  const matches = searchModels(index, keyword, { provider: options?.provider });
  const limited = options?.limit ? matches.slice(0, options.limit) : matches;

  if (options?.output === "json") {
    writeJson({
      query: keyword,
      provider: options?.provider,
      count: limited.length,
      results: limited.map(modelMatchToJson),
    });
    return;
  }

  if (limited.length === 0) {
    process.stdout.write("No models found.\n");
    return;
  }

  process.stdout.write(`${renderModelMatchesTable(limited)}\n`);
}
