import { describe, expect, test } from "vitest";

import {
  createVersionState,
  getStaleState,
  isRemoteNewer,
  shouldCheckRemoteVersion,
} from "../src/data/version.js";

describe("version helpers", () => {
  test("detects stale state correctly", () => {
    expect(getStaleState(100, 200)).toBe("yes");
    expect(getStaleState(200, 100)).toBe("no");
    expect(getStaleState(undefined, 100)).toBe("unknown");
  });

  test("marks remote as newer only when timestamp increases", () => {
    expect(isRemoteNewer(200, 100)).toBe(true);
    expect(isRemoteNewer(100, 100)).toBe(false);
    expect(isRemoteNewer(100, undefined)).toBe(true);
  });

  test("uses the version check interval", () => {
    const version = createVersionState({
      cache_origin: "bundled",
      last_checked_at: 1_000,
    });

    expect(shouldCheckRemoteVersion(version, 1_000)).toBe(false);
    expect(shouldCheckRemoteVersion(version, 1_000 + 6 * 60 * 60 * 1000)).toBe(true);
  });
});
