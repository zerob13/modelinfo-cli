export function toTimestamp(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      return asNumber;
    }

    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return undefined;
}

export function formatTimestamp(value: number | undefined): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

export function isExpired(
  lastCheckedAt: number | undefined,
  intervalMs: number,
  now = Date.now(),
): boolean {
  if (!lastCheckedAt) {
    return true;
  }

  return now - lastCheckedAt >= intervalMs;
}
