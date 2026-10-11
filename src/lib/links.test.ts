import { describe, expect, test } from "vitest";
import { isExternal, linkProps } from "./links";

describe("isExternal", () => {
  test.each([
    ["https://example.com", true],
    ["HTTP://EXAMPLE.COM", true],
    ["/about", false],
    ["mailto:a@b.co", false],
    ["//cdn.example.com", false],
    ["", false],
    [undefined, false],
  ])("%s -> %s", (url, expected) => {
    expect(isExternal(url)).toBe(expected);
  });
});

describe("linkProps", () => {
  test("external links open in a new tab with noopener", () => {
    expect(linkProps("https://example.com")).toEqual({
      href: "https://example.com",
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });

  test("internal links stay in-tab", () => {
    expect(linkProps("/store")).toEqual({ href: "/store" });
  });

  test("trims whitespace before deciding", () => {
    expect(linkProps("  https://example.com  ")).toMatchObject({
      href: "https://example.com",
      target: "_blank",
    });
  });

  test.each([undefined, "", "   "])("blank (%j) yields no href", (url) => {
    expect(linkProps(url)).toEqual({});
  });
});
