import { ensureRuntimeIndex } from "../data/remote.js";
import { providerSummaryToJson, writeJson, type OutputFormat } from "../format/json.js";
import { renderProvidersTable } from "../format/table.js";

export async function runProvidersCommand(options?: { output?: OutputFormat }): Promise<void> {
  const { index } = await ensureRuntimeIndex();
  const providers = [...index.providers].sort((left, right) => {
    const leftLabel = left.display_name ?? left.name ?? left.id;
    const rightLabel = right.display_name ?? right.name ?? right.id;

    return leftLabel.localeCompare(rightLabel);
  });

  if (options?.output === "json") {
    writeJson({
      count: providers.length,
      providers: providers.map(providerSummaryToJson),
    });
    return;
  }

  process.stdout.write(`${renderProvidersTable(providers)}\n`);
}
