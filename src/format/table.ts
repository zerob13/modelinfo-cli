import Table from "cli-table3";

import { reasonLabel } from "../search/rank.js";
import type {
  IndexedModel,
  IndexedProvider,
  RankedModelMatch,
  RankedProviderMatch,
} from "../data/types.js";
import { formatCost, formatLimit, modelLabel, providerLabel } from "./value.js";

function createTable(head: string[]) {
  return new Table({
    head,
    style: {
      compact: true,
      head: [],
      border: [],
    },
    wordWrap: true,
  });
}

export function renderModelMatchesTable(
  matches: RankedModelMatch[],
  options?: { includeReason?: boolean },
): string {
  const head = ["Model", "Provider", "Type", "Context", "Input Cost", "Output Cost"];
  if (options?.includeReason) {
    head.push("Match");
  }

  const table = createTable(head);
  matches.forEach((match) => {
    const row = [
      modelLabel(match.model),
      providerLabel(match.model),
      match.model.type ?? "-",
      formatLimit(match.model.context_limit),
      formatCost(match.model.cost_input),
      formatCost(match.model.cost_output),
    ];

    if (options?.includeReason) {
      row.push(reasonLabel(match.reason));
    }

    table.push(row);
  });

  return table.toString();
}

export function renderProvidersTable(providers: IndexedProvider[] | RankedProviderMatch[]): string {
  const table = createTable(["Provider ID", "Display Name", "API", "Models"]);

  providers.forEach((entry) => {
    const provider = "provider" in entry ? entry.provider : entry;
    table.push([
      provider.id,
      provider.display_name ?? provider.name ?? provider.id,
      provider.api ?? "-",
      String(provider.model_count),
    ]);
  });

  return table.toString();
}

export function renderProviderModelsTable(models: IndexedModel[]): string {
  const table = createTable(["Model", "Type", "Context", "Input Cost", "Output Cost"]);

  models.forEach((model) => {
    table.push([
      modelLabel(model),
      model.type ?? "-",
      formatLimit(model.context_limit),
      formatCost(model.cost_input),
      formatCost(model.cost_output),
    ]);
  });

  return table.toString();
}

export function renderDiffTable(left: IndexedModel, right: IndexedModel): string {
  const table = createTable(["Field", "Left", "Right"]);
  const rows: Array<[string, string, string]> = [
    ["Provider", providerLabel(left), providerLabel(right)],
    ["Type", left.type ?? "-", right.type ?? "-"],
    [
      "Input Modalities",
      left.input_modalities.join(", ") || "-",
      right.input_modalities.join(", ") || "-",
    ],
    [
      "Output Modalities",
      left.output_modalities.join(", ") || "-",
      right.output_modalities.join(", ") || "-",
    ],
    [
      "Reasoning",
      left.reasoning_supported === undefined ? "-" : left.reasoning_supported ? "yes" : "no",
      right.reasoning_supported === undefined ? "-" : right.reasoning_supported ? "yes" : "no",
    ],
    [
      "Tool Call",
      left.tool_call === undefined ? "-" : left.tool_call ? "yes" : "no",
      right.tool_call === undefined ? "-" : right.tool_call ? "yes" : "no",
    ],
    [
      "Attachment",
      left.attachment === undefined ? "-" : left.attachment ? "yes" : "no",
      right.attachment === undefined ? "-" : right.attachment ? "yes" : "no",
    ],
    [
      "Temperature",
      left.temperature === undefined ? "-" : left.temperature ? "yes" : "no",
      right.temperature === undefined ? "-" : right.temperature ? "yes" : "no",
    ],
    [
      "Vision",
      left.vision === undefined ? "-" : left.vision ? "yes" : "no",
      right.vision === undefined ? "-" : right.vision ? "yes" : "no",
    ],
    [
      "Open Weights",
      left.open_weights === undefined ? "-" : left.open_weights ? "yes" : "no",
      right.open_weights === undefined ? "-" : right.open_weights ? "yes" : "no",
    ],
    ["Knowledge", left.knowledge ?? "-", right.knowledge ?? "-"],
    ["Release Date", left.release_date ?? "-", right.release_date ?? "-"],
    ["Last Updated", left.last_updated ?? "-", right.last_updated ?? "-"],
    ["Input Cost", formatCost(left.cost_input), formatCost(right.cost_input)],
    ["Output Cost", formatCost(left.cost_output), formatCost(right.cost_output)],
    ["Cache Read", formatCost(left.cost_cache_read), formatCost(right.cost_cache_read)],
    ["Context Limit", formatLimit(left.context_limit), formatLimit(right.context_limit)],
    ["Output Limit", formatLimit(left.output_limit), formatLimit(right.output_limit)],
  ];

  rows.forEach((row) => table.push(row));
  return table.toString();
}
