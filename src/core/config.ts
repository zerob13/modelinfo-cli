import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const APP_NAME = "modelinfo";
export const APP_VERSION = "0.1.0";
export const INDEX_SCHEMA_VERSION = 1;
export const VERSION_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const REMOTE_VERSION_URL =
  "https://raw.githubusercontent.com/ThinkInAIXYZ/PublicProviderConf/refs/heads/dev/dist/dc_sync_version.json";
export const REMOTE_DATASET_URL =
  "https://raw.githubusercontent.com/ThinkInAIXYZ/PublicProviderConf/refs/heads/dev/dist/all.json";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = resolve(MODULE_DIR, "../..");
export const SEED_DIR = resolve(PACKAGE_ROOT, "seed");

export interface CachePaths {
  dir: string;
  raw: string;
  version: string;
  index: string;
}

export function getCachePaths(cacheDir = resolve(homedir(), ".modelinfo")): CachePaths {
  return {
    dir: cacheDir,
    raw: resolve(cacheDir, "all.json"),
    version: resolve(cacheDir, "version.json"),
    index: resolve(cacheDir, "index.json"),
  };
}

export function getSeedPaths() {
  return {
    dir: SEED_DIR,
    raw: resolve(SEED_DIR, "all.json"),
    version: resolve(SEED_DIR, "version.json"),
    index: resolve(SEED_DIR, "index.json"),
  };
}
