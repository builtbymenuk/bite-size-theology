// Runs the pre-existing node:assert self-check scripts (src/lib/*.check.ts) under Vitest. Each
// script asserts at import time, so importing it IS the test — a failed assert rejects the import.
import { describe, expect, test } from "vitest";

const checks = import.meta.glob("./*.check.ts");

describe("legacy self-check scripts", () => {
  test("are all discovered", () => {
    expect(Object.keys(checks).length).toBeGreaterThanOrEqual(10);
  });
  test.each(Object.keys(checks))("%s", async (file) => {
    await expect(checks[file]()).resolves.toBeDefined();
  });
});
