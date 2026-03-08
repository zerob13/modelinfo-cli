import type { CacheVersionState, IndexedModel, IndexDocument } from "../data/types.js";
import { collectKnownExtraFields } from "../data/index.js";
import { formatBoolean, formatCost, formatLimit, formatList, formatMaybe, modelLabel, providerLabel } from "./value.js";
import { formatTimestamp } from "../utils/time.js";

function renderBlock(title: string, rows: Array<[label: string, value: string]>): string {
  const width = rows.reduce((current, [label]) => Math.max(current, label.length), 0);
  const body = rows.length === 0 ? "  -" : rows.map(([label, value]) => `  ${label.padEnd(width, " ")} : ${value}`).join("\n");

  return `${title}\n${body}`;
}

function renderExtraFields(model: IndexedModel): string | undefined {
  const metadata = typeof model.raw.metadata === "object" && model.raw.metadata !== null ? model.raw.metadata : undefined;
  const extras: Array<[string, string]> = [];

  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      if (["description", "features", "typeHints", "pricing", "inputModalities", "modalities"].includes(key)) {
        continue;
      }

      extras.push([`metadata.${key}`, typeof value === "string" ? value : JSON.stringify(value)]);
    }
  }

  extras.push(...collectKnownExtraFields(model));
  if (extras.length === 0) {
    return undefined;
  }

  return renderBlock("Extra Fields", extras);
}

export function renderModelDetail(model: IndexedModel): string {
  const sections = [
    renderBlock("Model", [
      ["Model", modelLabel(model)],
      ["Model ID", model.model_id],
      ["Model Name", formatMaybe(model.model_name)],
      ["Display Name", formatMaybe(model.model_display_name)],
      ["Provider ID", model.provider_id],
      ["Provider Name", formatMaybe(model.provider_name)],
      ["Provider Display", formatMaybe(model.provider_display_name)],
      ["Provider API", formatMaybe(model.provider_api)],
      ["Provider Doc", formatMaybe(model.provider_doc)],
      ["Type", formatMaybe(model.type)],
    ]),
    renderBlock("Capabilities", [
      ["Input Modalities", formatList(model.input_modalities)],
      ["Output Modalities", formatList(model.output_modalities)],
      ["Reasoning", formatBoolean(model.reasoning_supported)],
      ["Reasoning Default", formatBoolean(model.reasoning_default)],
      ["Tool Call", formatBoolean(model.tool_call)],
      ["Attachment", formatBoolean(model.attachment)],
      ["Temperature", formatBoolean(model.temperature)],
      ["Vision", formatBoolean(model.vision)],
      ["Open Weights", formatBoolean(model.open_weights)],
    ]),
    renderBlock("Dates", [
      ["Knowledge", formatMaybe(model.knowledge)],
      ["Release Date", formatMaybe(model.release_date)],
      ["Last Updated", formatMaybe(model.last_updated)],
    ]),
    renderBlock("Pricing & Limits", [
      ["Input Cost", formatCost(model.cost_input)],
      ["Output Cost", formatCost(model.cost_output)],
      ["Cache Read", formatCost(model.cost_cache_read)],
      ["Context Limit", formatLimit(model.context_limit)],
      ["Output Limit", formatLimit(model.output_limit)],
    ]),
    renderBlock("Metadata", [
      ["Description", formatMaybe(model.metadata_description)],
      ["Features", formatList(model.metadata_features)],
      ["Type Hints", formatList(model.metadata_type_hints)],
    ]),
  ];

  const extras = renderExtraFields(model);
  if (extras) {
    sections.push(extras);
  }

  return sections.join("\n\n");
}

export function renderCapsDetail(model: IndexedModel): string {
  return renderBlock("Capabilities", [
    ["Model", modelLabel(model)],
    ["Provider", providerLabel(model)],
    ["Type", formatMaybe(model.type)],
    ["Input Modalities", formatList(model.input_modalities)],
    ["Output Modalities", formatList(model.output_modalities)],
    ["Reasoning", formatBoolean(model.reasoning_supported)],
    ["Tool Call", formatBoolean(model.tool_call)],
    ["Attachment", formatBoolean(model.attachment)],
    ["Temperature", formatBoolean(model.temperature)],
    ["Vision", formatBoolean(model.vision)],
    ["Open Weights", formatBoolean(model.open_weights)],
  ]);
}

export function renderCostDetail(model: IndexedModel): string {
  return renderBlock("Pricing", [
    ["Model", modelLabel(model)],
    ["Provider", providerLabel(model)],
    ["Input Cost", formatCost(model.cost_input)],
    ["Output Cost", formatCost(model.cost_output)],
    ["Cache Read", formatCost(model.cost_cache_read)],
  ]);
}

export function renderLimitDetail(model: IndexedModel): string {
  return renderBlock("Limits", [
    ["Model", modelLabel(model)],
    ["Provider", providerLabel(model)],
    ["Context Limit", formatLimit(model.context_limit)],
    ["Output Limit", formatLimit(model.output_limit)],
  ]);
}

export function renderDoctor(
  indexDocument: IndexDocument | undefined,
  versionState: CacheVersionState | undefined,
  paths: {
    dir: string;
    raw: string;
    version: string;
    index: string;
  },
  stale: "yes" | "no" | "unknown",
): string {
  return renderBlock("Doctor", [
    ["Cache Status", indexDocument ? "ready" : "missing"],
    ["Cache Dir", paths.dir],
    ["Raw Path", paths.raw],
    ["Version Path", paths.version],
    ["Index Path", paths.index],
    ["Local Version", versionState?.local_updated_at ? formatTimestamp(versionState.local_updated_at) : "-"],
    ["Last Checked", versionState?.last_checked_at ? formatTimestamp(versionState.last_checked_at) : "-"],
    ["Cache Origin", versionState?.cache_origin ?? "-"],
    ["Providers", indexDocument ? String(indexDocument.provider_count) : "-"],
    ["Models", indexDocument ? String(indexDocument.model_count) : "-"],
    ["Stale", stale],
  ]);
}
