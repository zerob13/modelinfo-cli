import type { IndexedModel, IndexedProvider } from "../data/types.js";
import { formatCostValue, formatInteger } from "../utils/numbers.js";

export function formatBoolean(value: boolean | undefined): string {
  if (value === undefined) {
    return "-";
  }

  return value ? "yes" : "no";
}

export function formatMaybe(value: string | number | undefined): string {
  if (value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export function formatList(values: string[]): string {
  if (values.length === 0) {
    return "-";
  }

  return values.join(", ");
}

export function formatCost(value: number | undefined): string {
  return formatCostValue(value);
}

export function formatLimit(value: number | undefined): string {
  return formatInteger(value);
}

export function modelLabel(model: Pick<IndexedModel, "model_id" | "model_name" | "model_display_name">): string {
  const primary = model.model_display_name ?? model.model_name ?? model.model_id;
  if (primary !== model.model_id) {
    return `${primary} (${model.model_id})`;
  }

  return primary;
}

export function providerLabel(
  provider: Pick<IndexedProvider, "id" | "name" | "display_name"> | Pick<IndexedModel, "provider_id" | "provider_name" | "provider_display_name">,
): string {
  if ("id" in provider) {
    const primary = provider.display_name ?? provider.name ?? provider.id;
    if (primary !== provider.id) {
      return `${primary} (${provider.id})`;
    }

    return primary;
  }

  const primary = provider.provider_display_name ?? provider.provider_name ?? provider.provider_id;
  if (primary !== provider.provider_id) {
    return `${primary} (${provider.provider_id})`;
  }

  return primary;
}
