import { ModelinfoError } from "../core/errors.js";
import { getModelsForProvider } from "../data/index.js";
import { renderProviderModelsTable, renderProvidersTable } from "../format/table.js";
import { requireSingleProvider, resolveProviderQuery } from "./shared.js";

export async function runListCommand(providerQuery: string): Promise<void> {
  const resolution = await resolveProviderQuery(providerQuery);
  const provider = requireSingleProvider(resolution);

  if (!provider) {
    if (resolution.matches.length === 0) {
      throw new ModelinfoError(`No provider matched "${providerQuery}".`, "PROVIDER_NOT_FOUND");
    }

    process.stdout.write(`${renderProvidersTable(resolution.matches)}\n`);
    process.exitCode = 1;
    return;
  }

  const models = getModelsForProvider(resolution.index, provider.id).sort((left, right) => {
    const leftLabel = left.model_display_name ?? left.model_name ?? left.model_id;
    const rightLabel = right.model_display_name ?? right.model_name ?? right.model_id;

    return leftLabel.localeCompare(rightLabel);
  });

  process.stdout.write(`${renderProviderModelsTable(models)}\n`);
}
