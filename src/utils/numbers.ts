export function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

export function formatInteger(value: number | undefined): string {
  if (value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCostValue(value: number | undefined): string {
  if (value === undefined) {
    return "-";
  }

  if (value === 0) {
    return "0";
  }

  if (Math.abs(value) >= 1) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(value);
  }

  return value.toPrecision(4).replace(/\.?0+$/, "");
}
