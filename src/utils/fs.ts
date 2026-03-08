import { copyFile, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const content = await readFile(path, "utf8");
  return JSON.parse(content) as T;
}

export async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await ensureDir(dirname(path));
  const tempPath = resolve(dirname(path), `.${randomUUID()}.tmp`);
  const content = `${JSON.stringify(value, null, 2)}\n`;

  await writeFile(tempPath, content, "utf8");
  await rename(tempPath, path);
}

export async function copyFileSafe(source: string, target: string): Promise<void> {
  await ensureDir(dirname(target));
  await copyFile(source, target);
}
