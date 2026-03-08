export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeNeedle(value: string): string {
  return value.trim().toLowerCase();
}

export function uniqueStrings(values: Iterable<string | undefined>): string[] {
  const result = new Set<string>();

  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      result.add(trimmed);
    }
  }

  return [...result];
}

export function stringArrayFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map((item) => toNonEmptyString(item)));
  }

  const single = toNonEmptyString(value);
  return single ? [single] : [];
}

export function lower(value: string | undefined): string | undefined {
  return value?.toLowerCase();
}
