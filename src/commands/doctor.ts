import { getCachePaths } from "../core/config.js";
import { fetchRemoteVersion } from "../data/remote.js";
import { readVersionState, readIndexDocument, ensureSeededCache } from "../data/cache.js";
import { getStaleState } from "../data/version.js";
import { renderDoctor } from "../format/detail.js";

export async function runDoctorCommand(): Promise<void> {
  const cachePaths = getCachePaths();
  await ensureSeededCache(cachePaths);

  const [index, version] = await Promise.all([readIndexDocument(cachePaths), readVersionState(cachePaths)]);

  let stale: "yes" | "no" | "unknown" = "unknown";
  try {
    const remoteVersion = await fetchRemoteVersion();
    stale = getStaleState(version?.local_updated_at, remoteVersion.updatedAt);
  } catch {
    stale = "unknown";
  }

  process.stdout.write(
    `${renderDoctor(
      index,
      version,
      { dir: cachePaths.dir, raw: cachePaths.raw, version: cachePaths.version, index: cachePaths.index },
      stale,
    )}\n`,
  );
}
