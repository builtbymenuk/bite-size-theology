import { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";
import { BASE } from "../../../../../test/request";
import { GET } from "./route";

const req = (cookie?: string) =>
  new NextRequest(`${BASE}/api/newsletter/status`, { headers: cookie ? { cookie } : {} });

describe("GET /api/newsletter/status", () => {
  test("subscribed:true when the bst_nl cookie is '1', never cached", async () => {
    const res = await GET(req("other=x; bst_nl=1"));
    expect(await res.json()).toEqual({ subscribed: true });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  test.each([undefined, "bst_nl=", "bst_nl=0", "bst_nlx=1"])("subscribed:false for cookie %j", async (c) => {
    const res = await GET(req(c));
    expect(await res.json()).toEqual({ subscribed: false });
  });
});
