import { ModelinfoError } from "../core/errors.js";
import { getModelsForProvider } from "../data/index.js";
import {
  modelSummaryToJson,
  providerMatchToJson,
  providerSummaryToJson,
  writeJson,
  type OutputFormat,
} from "../format/json.js";
import { renderProviderModelsTable, renderProvidersTable } from "../format/table.js";
import { requireSingleProvider, resolveProviderQuery } from "./shared.js";

export async function runListCommand(
  providerQuery: string,
  options?: { output?: OutputFormat },
): Promise<void> {
  const resolution = await resolveProviderQuery(providerQuery);
  const provider = requireSingleProvider(resolution);

  if (!provider) {
    if (resolution.matches.length === 0) {
      if (options?.output === "json") {
        writeJson({ error: "PROVIDER_NOT_FOUND", query: providerQuery });
        process.exitCode = 1;
        return;
      }

      throw new ModelinfoError(`No provider matched "${providerQuery}".`, "PROVIDER_NOT_FOUND");
    }

    if (options?.output === "json") {
      writeJson({
        query: providerQuery,
        count: resolution.matches.length,
        results: resolution.matches.map(providerMatchToJson),
      });
      process.exitCode = 1;
      return;
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

  if (options?.output === "json") {
    writeJson({
      provider: providerSummaryToJson(provider),
      count: models.length,
      models: models.map(modelSummaryToJson),
    });
    return;
  }

  process.stdout.write(`${renderProviderModelsTable(models)}\n`);
}
