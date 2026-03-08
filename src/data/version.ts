import { INDEX_SCHEMA_VERSION, VERSION_CHECK_INTERVAL_MS } from "../core/config.js";
import type { CacheVersionState } from "./types.js";
import { isExpired } from "../utils/time.js";

export function createVersionState(input: Partial<CacheVersionState>): CacheVersionState {
  return {
    schema_version: INDEX_SCHEMA_VERSION,
    cache_origin: input.cache_origin ?? "remote",
    local_updated_at: input.local_updated_at,
    last_checked_remote_updated_at: input.last_checked_remote_updated_at,
    last_checked_at: input.last_checked_at,
    index_built_at: input.index_built_at,
  };
}

export function isRemoteNewer(remoteUpdatedAt: number, localUpdatedAt: number | undefined): boolean {
  if (!localUpdatedAt) {
    return true;
  }

  return remoteUpdatedAt > localUpdatedAt;
}

export function shouldCheckRemoteVersion(
  versionState: CacheVersionState | undefined,
  now = Date.now(),
): boolean {
  return isExpired(versionState?.last_checked_at, VERSION_CHECK_INTERVAL_MS, now);
}

export function getStaleState(
  localUpdatedAt: number | undefined,
  remoteUpdatedAt: number | undefined,
): "yes" | "no" | "unknown" {
  if (!localUpdatedAt || !remoteUpdatedAt) {
    return "unknown";
  }

  return remoteUpdatedAt > localUpdatedAt ? "yes" : "no";
}
