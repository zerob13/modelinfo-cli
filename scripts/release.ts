#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import semver from "semver";

type PackageJson = {
  version: string;
  publishConfig?: {
    access?: string;
    tag?: string;
  };
};

type ReleaseChannel = "latest" | "beta";

type VersionChoice = {
  label: string;
  value: string;
  version: string;
};

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, "package.json");
const manifestPath = path.join(rootDir, ".release-please-manifest.json");

function run(command: string, args: string[], options?: { stdio?: "inherit" | "pipe" }) {
  return execFileSync(command, args, {
    cwd: rootDir,
    stdio: options?.stdio ?? "pipe",
    encoding: "utf8",
  }).trim();
}

function fail(message: string): never {
  log.error(message);
  process.exit(1);
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function writeJsonFile(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureFile(filePath: string) {
  if (!existsSync(filePath)) {
    fail(`Missing file: ${path.relative(rootDir, filePath)}`);
  }
}

function promptOrExit<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Release cancelled.");
    process.exit(0);
  }

  return value;
}

function getVersionChoices(currentVersion: string, channel: ReleaseChannel): VersionChoice[] {
  const parsed = semver.parse(currentVersion);

  if (!parsed) {
    fail(`Invalid version in package.json: ${currentVersion}`);
  }

  if (channel === "latest") {
    return [
      {
        label: `patch -> ${semver.inc(currentVersion, "patch")}`,
        value: "patch",
        version: semver.inc(currentVersion, "patch")!,
      },
      {
        label: `minor -> ${semver.inc(currentVersion, "minor")}`,
        value: "minor",
        version: semver.inc(currentVersion, "minor")!,
      },
      {
        label: `major -> ${semver.inc(currentVersion, "major")}`,
        value: "major",
        version: semver.inc(currentVersion, "major")!,
      },
      {
        label: "custom",
        value: "custom",
        version: currentVersion,
      },
    ];
  }

  const prerelease = parsed.prerelease.length > 0 ? "prerelease" : "prepatch";

  return [
    {
      label: `${prerelease} -> ${semver.inc(currentVersion, prerelease as semver.ReleaseType, "beta")}`,
      value: prerelease,
      version: semver.inc(currentVersion, prerelease as semver.ReleaseType, "beta")!,
    },
    {
      label: `preminor -> ${semver.inc(currentVersion, "preminor", "beta")}`,
      value: "preminor",
      version: semver.inc(currentVersion, "preminor", "beta")!,
    },
    {
      label: `premajor -> ${semver.inc(currentVersion, "premajor", "beta")}`,
      value: "premajor",
      version: semver.inc(currentVersion, "premajor", "beta")!,
    },
    {
      label: "custom",
      value: "custom",
      version: currentVersion,
    },
  ];
}

function requireCleanGit() {
  const status = run("git", ["status", "--porcelain"]);

  if (status.length > 0) {
    fail("Working tree is not clean. Commit or stash changes before release.");
  }
}

function requireNpmLogin() {
  try {
    return run("npm", ["whoami"]);
  } catch {
    fail("npm login is required before publishing.");
  }
}

function updateVersionFiles(nextVersion: string, channel: ReleaseChannel) {
  const packageJson = readJsonFile<PackageJson>(packageJsonPath);
  const manifest = readJsonFile<Record<string, string>>(manifestPath);

  packageJson.version = nextVersion;
  packageJson.publishConfig = {
    ...(packageJson.publishConfig ?? {}),
    access: "public",
    tag: channel,
  };
  manifest["."] = nextVersion;

  writeJsonFile(packageJsonPath, packageJson);
  writeJsonFile(manifestPath, manifest);
}

function ensureValidCustomVersion(
  inputVersion: string,
  currentVersion: string,
  channel: ReleaseChannel,
) {
  const normalized = semver.valid(inputVersion);

  invariant(normalized, `Invalid semver version: ${inputVersion}`);
  invariant(
    semver.gt(normalized, currentVersion),
    `Next version must be greater than current version ${currentVersion}.`,
  );
  invariant(
    channel !== "beta" || normalized.includes("-beta."),
    "Beta release must use a prerelease version like 0.2.0-beta.0.",
  );
  invariant(
    channel !== "latest" || !semver.prerelease(normalized),
    "Release channel latest cannot publish a prerelease version.",
  );

  return normalized;
}

async function main() {
  ensureFile(packageJsonPath);
  ensureFile(manifestPath);

  intro("modelinfo release");

  requireCleanGit();

  const currentBranch = run("git", ["branch", "--show-current"]);
  const currentTag = run("git", ["tag", "--list"]);
  const packageJson = readJsonFile<PackageJson>(packageJsonPath);
  const currentVersion = packageJson.version;

  log.step(`Current branch: ${currentBranch || "(detached)"}`);
  log.step(`Current version: ${currentVersion}`);
  log.step(`Existing tags: ${currentTag ? currentTag.split("\n").length : 0}`);

  const channel = promptOrExit(
    await select<ReleaseChannel>({
      message: "Select publish channel",
      options: [
        { label: "release (latest)", value: "latest", hint: "Stable release" },
        { label: "beta", value: "beta", hint: "Publish with npm beta tag" },
      ],
    }),
  );

  const versionChoices = getVersionChoices(currentVersion, channel);
  const versionMode = promptOrExit(
    await select<string>({
      message: "Select next version",
      options: versionChoices.map((choice) => ({
        label: choice.label,
        value: choice.value,
      })),
    }),
  );

  let nextVersion =
    versionChoices.find((choice) => choice.value === versionMode)?.version ?? currentVersion;

  if (versionMode === "custom") {
    const customVersion = promptOrExit(
      await text({
        message: "Enter custom version",
        placeholder: channel === "beta" ? "0.2.0-beta.0" : "0.2.0",
        validate(value) {
          try {
            ensureValidCustomVersion(value, currentVersion, channel);
            return undefined;
          } catch (error) {
            return error instanceof Error ? error.message : "Invalid version";
          }
        },
      }),
    );

    nextVersion = ensureValidCustomVersion(customVersion, currentVersion, channel);
  }

  const shouldRunChecks = promptOrExit(
    await confirm({
      message: "Run format, lint, test, and build before publish?",
      initialValue: true,
    }),
  );

  const shouldPush = promptOrExit(
    await confirm({
      message: "Push commit and tag to origin after publish?",
      initialValue: true,
    }),
  );

  const shouldContinue = promptOrExit(
    await confirm({
      message: `Publish ${nextVersion} to npm with tag "${channel}"?`,
      initialValue: true,
    }),
  );

  if (!shouldContinue) {
    cancel("Release cancelled.");
    return;
  }

  const npmUser = requireNpmLogin();
  log.info(`npm user: ${npmUser}`);

  const releaseSpinner = spinner();
  releaseSpinner.start("Updating version files");
  updateVersionFiles(nextVersion, channel);
  releaseSpinner.stop(`Version updated to ${nextVersion}`);

  if (shouldRunChecks) {
    releaseSpinner.start("Running release checks");
    run("bun", ["run", "format:check"], { stdio: "inherit" });
    run("bun", ["run", "lint"], { stdio: "inherit" });
    run("bun", ["run", "test"], { stdio: "inherit" });
    run("bun", ["run", "build:seed"], { stdio: "inherit" });
    run("bun", ["run", "build"], { stdio: "inherit" });
    releaseSpinner.stop("Release checks passed");
  }

  releaseSpinner.start("Creating release commit");
  run("git", ["add", "package.json", ".release-please-manifest.json"], { stdio: "inherit" });
  run("git", ["commit", "-m", `chore: release ${nextVersion}`], { stdio: "inherit" });
  releaseSpinner.stop("Release commit created");

  const tagName = `v${nextVersion}`;

  releaseSpinner.start(`Creating tag ${tagName}`);
  run("git", ["tag", tagName], { stdio: "inherit" });
  releaseSpinner.stop(`Tag ${tagName} created`);

  releaseSpinner.start(`Publishing ${nextVersion} to npm`);
  run("npm", ["publish", "--access", "public", "--tag", channel], { stdio: "inherit" });
  releaseSpinner.stop(`Published ${nextVersion} to npm`);

  if (shouldPush) {
    releaseSpinner.start("Pushing commit and tag");
    run("git", ["push", "origin", "HEAD"], { stdio: "inherit" });
    run("git", ["push", "origin", tagName], { stdio: "inherit" });
    releaseSpinner.stop("Pushed commit and tag");
  }

  outro(`Release finished: ${nextVersion} (${channel})`);
}

main().catch((error) => {
  if (error instanceof Error) {
    fail(error.message);
  }

  fail("Release failed.");
});
