import { beforeEach, describe, expect, test, vi } from "vitest";
import { CONFIGURED, withEnv } from "../../../../../test/env";
import { type Call, stubFetch } from "../../../../../test/fetch-stub";
import { getRequest } from "../../../../../test/request";

// Spy on the shared constant-time comparison so the tests can prove the route goes through it.
const secretCalls = vi.hoisted(() => [] as unknown[][]);
vi.mock("@/lib/secret", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/secret")>();
  return {
    secretMatches: (...args: Parameters<typeof real.secretMatches>) => {
      secretCalls.push(args);
      return real.secretMatches(...args);
    },
  };
});

const ENV = { ...CONFIGURED, REVALIDATE_SECRET: "s3cret" };
const load = (env: Record<string, string> = ENV) => withEnv(env, () => import("./route"));

const SUBS = "strapi.test/api/newsletter-subscribers";

const sub = (email: string, subscriptionStatus: string, i = 0) => ({
  documentId: `d-${email}-${i}`,
  email,
  subscriptionStatus,
  confirmToken: "t",
});

// The route sleeps 120ms between Resend calls; run it under fake timers and flush them.
async function run(GET: (r: Request) => Promise<Response>, query = "?secret=s3cret") {
  vi.useFakeTimers();
  const pending = GET(getRequest(`/api/newsletter/sync${query}`));
  await vi.runAllTimersAsync();
  return pending;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/newsletter/sync", () => {
  test.each([
    ["missing", ""],
    ["wrong", "?secret=nope"],
  ])("401 on a %s secret, no calls", async (_l, q) => {
    const { GET } = await load();
    const net = stubFetch({ "": { json: {} } });
    const res = await GET(getRequest(`/api/newsletter/sync${q}`));
    expect(res.status).toBe(401);
    expect(net.calls).toHaveLength(0);
  });

  test("401 when REVALIDATE_SECRET is unset, even if the query is empty", async () => {
    const { GET } = await load(CONFIGURED);
    stubFetch({});
    expect((await GET(getRequest("/api/newsletter/sync?secret="))).status).toBe(401);
  });

  test.each([
    ["Strapi", { STRAPI_API_TOKEN: "" }],
    ["Resend", { RESEND_API_KEY: "" }],
  ])("503 when %s is not configured", async (_l, off) => {
    const { GET } = await load({ ...ENV, ...off });
    const net = stubFetch({});
    const res = await GET(getRequest("/api/newsletter/sync?secret=s3cret"));
    expect(res.status).toBe(503);
    expect(net.calls).toHaveLength(0);
  });

  test("adds active, flags unsubscribed, skips pending, counts failures", async () => {
    const { GET } = await load();
    const net = stubFetch({
      [SUBS]: {
        json: {
          data: [
            sub("a@x.co", "active"),
            sub("p@x.co", "pending"),
            sub("u@x.co", "unsubscribed"),
            sub("bad@x.co", "active"),
          ],
        },
      },
      "api.resend.com/contacts": (c: Call) =>
        // Both the create (body email) and the PATCH fallback (URL) fail for bad@x.co.
        c.url.includes("bad%40x.co") || (c.body as { email?: string }).email === "bad@x.co"
          ? { status: 500, json: {} }
          : { json: {} },
    });
    const res = await run(GET);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, added: 1, unsubscribed: 1, failed: 1, more: false });

    // One short page -> no second list request.
    expect(net.to(SUBS)).toHaveLength(1);
    expect(net.to(SUBS)[0].url).toContain("pagination[page]=1&pagination[pageSize]=100");
    expect(net.calls.some((c) => JSON.stringify(c.body ?? "").includes("p@x.co"))).toBe(false);
    expect(net.to("contacts/u%40x.co")[0]).toMatchObject({ method: "PATCH", body: { unsubscribed: true } });
  });

  test("walks full pages until a short one", async () => {
    const { GET } = await load();
    const net = stubFetch({
      [SUBS]: (c: Call) => ({
        json: {
          data: c.url.includes("pagination[page]=1&")
            ? Array.from({ length: 100 }, (_, i) => sub(`p${i}@x.co`, "pending", i))
            : [sub("late@x.co", "active")],
        },
      }),
      "api.resend.com/contacts": { json: {} },
    });
    const res = await run(GET);
    expect(await res.json()).toMatchObject({ ok: true, added: 1, more: false });
    expect(net.to(SUBS)).toHaveLength(2);
  });

  test("stops at 500 per run and reports more:true", async () => {
    const { GET } = await load();
    stubFetch({
      [SUBS]: { json: { data: Array.from({ length: 100 }, (_, i) => sub(`a${i}@x.co`, "active", i)) } },
      "api.resend.com/contacts": { json: {} },
    });
    const res = await run(GET);
    expect(await res.json()).toEqual({ ok: true, added: 500, unsubscribed: 0, failed: 0, more: true });
  });

  test("500 with partial counts when Strapi fails mid-walk", async () => {
    const { GET } = await load();
    stubFetch({
      [SUBS]: (c: Call) =>
        c.url.includes("pagination[page]=1&")
          ? { json: { data: Array.from({ length: 100 }, (_, i) => sub(`a${i}@x.co`, "active", i)) } }
          : { status: 500, json: {} },
      "api.resend.com/contacts": { json: {} },
    });
    const res = await run(GET);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ ok: false, added: 100 });
  });
});

describe("secret comparison", () => {
  test("a same-length near miss is rejected, and the check goes through constant-time secretMatches", async () => {
    const { GET } = await load();
    const net = stubFetch({});
    secretCalls.length = 0;
    const res = await GET(getRequest("/api/newsletter/sync?secret=s3creX"));
    expect(res.status).toBe(401);
    expect(secretCalls).toEqual([["s3creX", "s3cret"]]);
    expect(net.calls).toHaveLength(0);
  });
});
