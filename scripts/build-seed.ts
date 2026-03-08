import { getSeedPaths } from "../src/core/config.js";
import { buildIndexDocument } from "../src/data/index.js";
import { normalizeDataset } from "../src/data/normalize.js";
import { fetchRemoteDataset, fetchRemoteVersion } from "../src/data/remote.js";
import { createVersionState } from "../src/data/version.js";
import { ensureDir, writeJsonAtomic } from "../src/utils/fs.js";

async function main(): Promise<void> {
  const seedPaths = getSeedPaths();
  await ensureDir(seedPaths.dir);

  const { updatedAt } = await fetchRemoteVersion();
  const dataset = await fetchRemoteDataset();
  const normalized = normalizeDataset(dataset);
  const index = buildIndexDocument({
    ...normalized,
    source_updated_at: updatedAt,
  });
  const version = createVersionState({
    cache_origin: "bundled",
    local_updated_at: updatedAt,
    last_checked_remote_updated_at: updatedAt,
    last_checked_at: Date.now(),
    index_built_at: index.generated_at,
  });

  await writeJsonAtomic(seedPaths.raw, dataset);
  await writeJsonAtomic(seedPaths.index, index);
  await writeJsonAtomic(seedPaths.version, version);

  process.stdout.write(
    `Seed built: providers=${index.provider_count} models=${index.model_count} updated_at=${updatedAt}\n`,
  );
}

await main();
