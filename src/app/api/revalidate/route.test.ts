import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { withEnv } from "../../../../test/env";
import { BASE, rawRequest } from "../../../../test/request";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const load = (env: Record<string, string> = { REVALIDATE_SECRET: "s3cret" }) =>
  withEnv(env, () => import("./route"));

const post = (query: string, body?: unknown) =>
  rawRequest(`/api/revalidate${query}`, body === undefined ? "" : JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });

const tagged = () => vi.mocked(revalidateTag).mock.calls.map(([tag]) => tag);

beforeEach(() => {
  vi.mocked(revalidateTag).mockClear();
});

describe("POST /api/revalidate", () => {
  test("401 when REVALIDATE_SECRET is unset (even with an empty secret param)", async () => {
    const { POST } = await load({});
    const res = await POST(post("?secret=", { model: "hero" }));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test.each(["", "?secret=wrong", "?secret=S3CRET"])("401 on bad secret %j", async (q) => {
    const { POST } = await load();
    const res = await POST(post(q, { model: "hero" }));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test("a known model revalidates only its tag (with the 'max' profile)", async () => {
    const { POST } = await load();
    const res = await POST(post("?secret=s3cret", { model: "hero" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, revalidated: ["hero"] });
    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith("hero", "max");
  });

  test.each([
    ["product", "products"],
    ["category", "categories"],
    ["post", "posts"],
    ["post-category", "post-categories"],
  ])("singular alias %s -> %s", async (model, tag) => {
    const { POST } = await load();
    const res = await POST(post("?secret=s3cret", { model }));
    expect((await res.json()).revalidated).toEqual([tag]);
    expect(tagged()).toEqual([tag]);
  });

  test.each([
    ["an unknown model", { model: "nope" }],
    ["no model", {}],
    ["an empty body", undefined],
  ])("%s revalidates every tag", async (_l, body) => {
    const { POST } = await load();
    const res = await POST(post("?secret=s3cret", body));
    const { revalidated } = await res.json();
    expect(revalidated.length).toBeGreaterThan(10);
    expect(revalidated).toEqual(expect.arrayContaining(["hero", "products", "posts", "contact"]));
    expect(tagged()).toEqual(revalidated);
  });

  test("a non-JSON body also falls back to all tags", async () => {
    const { POST } = await load();
    const res = await POST(new Request(`${BASE}/api/revalidate?secret=s3cret`, { method: "POST", body: "{x" }));
    expect(res.status).toBe(200);
    expect(tagged().length).toBeGreaterThan(10);
  });

  test.todo("REVALIDATE_SECRET compared with non-constant-time !== (revalidate/route.ts:24)");
});
