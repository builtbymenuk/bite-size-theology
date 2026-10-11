import { describe, expect, test } from "vitest";
import { secretMatches } from "./secret";

describe("secretMatches", () => {
  test("the right secret matches", () => {
    expect(secretMatches("s3cret-value", "s3cret-value")).toBe(true);
  });

  test("a wrong secret, a prefix, or a different length doesn't", () => {
    expect(secretMatches("s3cret-valuX", "s3cret-value")).toBe(false);
    expect(secretMatches("s3cret", "s3cret-value")).toBe(false);
    expect(secretMatches("s3cret-value-and-more", "s3cret-value")).toBe(false);
  });

  test("an unset expected secret never matches, whatever is given", () => {
    for (const expected of [undefined, ""]) {
      expect(secretMatches("anything", expected)).toBe(false);
      expect(secretMatches("", expected)).toBe(false);
      expect(secretMatches(null, expected)).toBe(false);
    }
  });

  test("a missing or empty given secret never matches", () => {
    expect(secretMatches(null, "s3cret")).toBe(false);
    expect(secretMatches(undefined, "s3cret")).toBe(false);
    expect(secretMatches("", "s3cret")).toBe(false);
  });
});
