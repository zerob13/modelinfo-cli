import {
  APP_NAME,
  APP_VERSION,
  REMOTE_DATASET_URL,
  REMOTE_VERSION_URL,
  getCachePaths,
} from "../core/config.js";
import type { CachePaths } from "../core/config.js";
import { ModelinfoError, toErrorMessage } from "../core/errors.js";
import { logWarn } from "../core/logger.js";
import { buildIndexDocument } from "./index.js";
import {
  ensureSeededCache,
  readIndexDocument,
  readRawDataset,
  readVersionState,
  writeIndexDocument,
  writeRawDataset,
  writeVersionState,
} from "./cache.js";
import { normalizeDataset } from "./normalize.js";
import { parseDataset, parseVersionFile } from "./schema.js";
import type { CacheVersionState, IndexDocument, RawDataset, SyncResult } from "./types.js";
import { createVersionState, isRemoteNewer, shouldCheckRemoteVersion } from "./version.js";
import { toTimestamp } from "../utils/time.js";

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": `${APP_NAME}/${APP_VERSION}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ModelinfoError(
        `Request failed: ${response.status} ${response.statusText}`,
        "REMOTE_FETCH_FAILED",
      );
    }

    return (await response.json()) as unknown;
  } catch (error) {
    throw new ModelinfoError(
      `Failed to fetch ${url}: ${toErrorMessage(error)}`,
      "REMOTE_FETCH_FAILED",
      {
        cause: error,
      },
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRemoteVersion(): Promise<{ updatedAt: number }> {
  const raw = await fetchJson(REMOTE_VERSION_URL);
  const parsed = parseVersionFile(raw);
  const updatedAt = toTimestamp(parsed.updated_at);

  if (!updatedAt) {
    throw new ModelinfoError(
      "Remote version file is missing a valid updated_at timestamp.",
      "INVALID_REMOTE_VERSION",
    );
  }

  return { updatedAt };
}

export async function fetchRemoteDataset(): Promise<RawDataset> {
  const raw = await fetchJson(REMOTE_DATASET_URL);
  return parseDataset(raw);
}

async function rebuildIndexFromRawCache(
  cachePaths: CachePaths,
  versionState: CacheVersionState | undefined,
): Promise<IndexDocument | undefined> {
  const rawDataset = await readRawDataset(cachePaths);
  if (!rawDataset) {
    return undefined;
  }

  const normalized = normalizeDataset(rawDataset);
  const built = buildIndexDocument(normalized);
  const nextVersion = createVersionState({
    cache_origin: versionState?.cache_origin ?? "bundled",
    local_updated_at: versionState?.local_updated_at ?? normalized.source_updated_at,
    last_checked_remote_updated_at: versionState?.last_checked_remote_updated_at,
    last_checked_at: versionState?.last_checked_at,
    index_built_at: built.generated_at,
  });

  await writeIndexDocument(built, cachePaths);
  await writeVersionState(nextVersion, cachePaths);
  return built;
}

export async function syncCacheFromRemote(
  cachePaths: CachePaths = getCachePaths(),
  remoteUpdatedAt?: number,
): Promise<SyncResult> {
  const currentVersion = await readVersionState(cachePaths);
  const versionInfo =
    remoteUpdatedAt !== undefined ? { updatedAt: remoteUpdatedAt } : await fetchRemoteVersion();
  const nextUpdatedAt = versionInfo.updatedAt;
  const currentIndex = await readIndexDocument(cachePaths);

  if (!isRemoteNewer(nextUpdatedAt, currentVersion?.local_updated_at) && currentIndex) {
    const nextVersion = createVersionState({
      cache_origin: currentVersion?.cache_origin ?? "remote",
      local_updated_at: currentVersion?.local_updated_at ?? nextUpdatedAt,
      last_checked_remote_updated_at: nextUpdatedAt,
      last_checked_at: Date.now(),
      index_built_at: currentVersion?.index_built_at ?? currentIndex.generated_at,
    });

    await writeVersionState(nextVersion, cachePaths);

    return {
      updated: false,
      old_version: currentVersion?.local_updated_at,
      new_version: currentVersion?.local_updated_at ?? nextUpdatedAt,
      provider_count: currentIndex.provider_count,
      model_count: currentIndex.model_count,
      cache_origin: nextVersion.cache_origin,
    };
  }

  const dataset = await fetchRemoteDataset();
  const normalized = normalizeDataset(dataset);
  const indexDocument = buildIndexDocument(normalized);
  const nextVersion = createVersionState({
    cache_origin: "remote",
    local_updated_at: nextUpdatedAt,
    last_checked_remote_updated_at: nextUpdatedAt,
    last_checked_at: Date.now(),
    index_built_at: indexDocument.generated_at,
  });

  await writeRawDataset(dataset, cachePaths);
  await writeIndexDocument(indexDocument, cachePaths);
  await writeVersionState(nextVersion, cachePaths);

  return {
    updated: true,
    old_version: currentVersion?.local_updated_at,
    new_version: nextUpdatedAt,
    provider_count: indexDocument.provider_count,
    model_count: indexDocument.model_count,
    cache_origin: "remote",
  };
}

export async function ensureRuntimeIndex(
  cachePaths: CachePaths = getCachePaths(),
): Promise<{ index: IndexDocument; version: CacheVersionState | undefined }> {
  await ensureSeededCache(cachePaths);

  let versionState = await readVersionState(cachePaths);
  let indexDocument: IndexDocument | undefined;

  try {
    indexDocument = await readIndexDocument(cachePaths);
  } catch {
    indexDocument = await rebuildIndexFromRawCache(cachePaths, versionState);
  }

  if (!indexDocument) {
    await syncCacheFromRemote(cachePaths);
    versionState = await readVersionState(cachePaths);
    indexDocument = await readIndexDocument(cachePaths);
  }

  if (!indexDocument) {
    throw new ModelinfoError("No usable local index is available.", "INDEX_NOT_AVAILABLE");
  }

  if (shouldCheckRemoteVersion(versionState)) {
    try {
      const { updatedAt } = await fetchRemoteVersion();
      if (isRemoteNewer(updatedAt, versionState?.local_updated_at)) {
        await syncCacheFromRemote(cachePaths, updatedAt);
        versionState = await readVersionState(cachePaths);
        indexDocument = await readIndexDocument(cachePaths);
      } else {
        const nextVersion = createVersionState({
          cache_origin: versionState?.cache_origin ?? "bundled",
          local_updated_at: versionState?.local_updated_at ?? indexDocument.source_updated_at,
          last_checked_remote_updated_at: updatedAt,
          last_checked_at: Date.now(),
          index_built_at: versionState?.index_built_at ?? indexDocument.generated_at,
        });

        await writeVersionState(nextVersion, cachePaths);
        versionState = nextVersion;
      }
    } catch (error) {
      logWarn(`Version check failed, using local cache: ${toErrorMessage(error)}`);
    }
  }

  if (!indexDocument) {
    throw new ModelinfoError("Failed to load the local index after sync.", "INDEX_NOT_AVAILABLE");
  }

  return {
    index: indexDocument,
    version: versionState,
  };
}
