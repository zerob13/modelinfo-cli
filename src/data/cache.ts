import { readFile } from "node:fs/promises";

import { getCachePaths, getSeedPaths } from "../core/config.js";
import type { CachePaths } from "../core/config.js";
import type { CacheVersionState, IndexDocument, RawDataset } from "./types.js";
import { parseDataset, parseIndexDocument } from "./schema.js";
import { copyFileSafe, ensureDir, fileExists, readJsonFile, writeJsonAtomic } from "../utils/fs.js";
import { createVersionState } from "./version.js";

export async function ensureSeededCache(
  cachePaths: CachePaths = getCachePaths(),
): Promise<boolean> {
  const seedPaths = getSeedPaths();
  await ensureDir(cachePaths.dir);

  const canSeed =
    (await fileExists(seedPaths.index)) &&
    (await fileExists(seedPaths.version)) &&
    (await fileExists(seedPaths.raw));

  if (!canSeed) {
    return false;
  }

  let copied = false;
  if (!(await fileExists(cachePaths.index))) {
    await copyFileSafe(seedPaths.index, cachePaths.index);
    copied = true;
  }

  if (!(await fileExists(cachePaths.version))) {
    await copyFileSafe(seedPaths.version, cachePaths.version);
    copied = true;
  }

  if (!(await fileExists(cachePaths.raw))) {
    await copyFileSafe(seedPaths.raw, cachePaths.raw);
    copied = true;
  }

  return copied;
}

export async function readVersionState(
  cachePaths: CachePaths = getCachePaths(),
): Promise<CacheVersionState | undefined> {
  if (!(await fileExists(cachePaths.version))) {
    return undefined;
  }

  const value = await readJsonFile<Partial<CacheVersionState>>(cachePaths.version);
  return createVersionState({
    cache_origin: value.cache_origin ?? "bundled",
    local_updated_at: value.local_updated_at,
    last_checked_remote_updated_at: value.last_checked_remote_updated_at,
    last_checked_at: value.last_checked_at,
    index_built_at: value.index_built_at,
  });
}

export async function writeVersionState(
  value: CacheVersionState,
  cachePaths: CachePaths = getCachePaths(),
): Promise<void> {
  await writeJsonAtomic(cachePaths.version, value);
}

export async function readIndexDocument(
  cachePaths: CachePaths = getCachePaths(),
): Promise<IndexDocument | undefined> {
  if (!(await fileExists(cachePaths.index))) {
    return undefined;
  }

  const value = await readJsonFile<unknown>(cachePaths.index);
  return parseIndexDocument(value);
}

export async function writeIndexDocument(
  value: IndexDocument,
  cachePaths: CachePaths = getCachePaths(),
): Promise<void> {
  await writeJsonAtomic(cachePaths.index, value);
}

export async function readRawDataset(
  cachePaths: CachePaths = getCachePaths(),
): Promise<RawDataset | undefined> {
  if (!(await fileExists(cachePaths.raw))) {
    return undefined;
  }

  const content = await readFile(cachePaths.raw, "utf8");
  return parseDataset(JSON.parse(content));
}

export async function writeRawDataset(
  value: RawDataset,
  cachePaths: CachePaths = getCachePaths(),
): Promise<void> {
  await writeJsonAtomic(cachePaths.raw, value);
}
