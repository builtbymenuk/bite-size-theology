import { NextResponse } from "next/server";
import { describe, expect, test } from "vitest";
import { CONFIGURED, withEnv } from "../../test/env";
import { stubFetch } from "../../test/fetch-stub";

const load = (env: Record<string, string> = CONFIGURED) =>
  withEnv(env, () => import("./newsletter-store"));

const STRAPI_ROW = {
  documentId: "doc1",
  email: "jane@example.com",
  subscriptionStatus: "active",
  confirmToken: "tok",
  source: "popup",
  createdAt: "2026-01-01",
};
const SUBSCRIBER = {
  documentId: "doc1",
  email: "jane@example.com",
  status: "active",
  confirmToken: "tok",
  source: "popup",
};

describe("configured / call()", () => {
  test("configured() is true with both STRAPI_URL and STRAPI_API_TOKEN", async () => {
    expect((await load()).configured()).toBe(true);
  });

  test.each<Record<string, string>>([{ STRAPI_URL: "http://strapi.test" }, { STRAPI_API_TOKEN: "t" }])(
    "configured() is false with only %j",
    async (env) => {
      expect((await load(env)).configured()).toBe(false);
    },
  );

  test("throws (no request) when Strapi is not configured", async () => {
    const { findByEmail, create } = await load({});
    const net = stubFetch({ "strapi.test": { json: {} } });
    await expect(findByEmail("jane@example.com")).rejects.toThrow(/not set/);
    await expect(create({ email: "jane@example.com" })).rejects.toThrow(/not set/);
    expect(net.calls).toHaveLength(0);
  });

  test("throws on a non-OK Strapi response", async () => {
    const { findByToken } = await load();
    stubFetch({ "strapi.test": { status: 500, json: {} } });
    await expect(findByToken("tok")).rejects.toThrow(/-> 500/);
  });
});

describe("finders", () => {
  test("findByEmail filters by encoded email with the Bearer token and maps the row", async () => {
    const { findByEmail } = await load();
    const net = stubFetch({ "strapi.test/api/newsletter-subscribers": { json: { data: [STRAPI_ROW] } } });
    expect(await findByEmail("jane+x@example.com")).toEqual(SUBSCRIBER);
    const [c] = net.calls;
    expect(c.method).toBe("GET");
    expect(c.url).toBe(
      "http://strapi.test/api/newsletter-subscribers?filters[email][$eq]=jane%2Bx%40example.com&pagination[pageSize]=1",
    );
    expect(c.headers.authorization).toBe("Bearer test-token");
    expect(c.body).toBeUndefined();
  });

  test("findByToken filters on confirmToken; null when nothing matches", async () => {
    const { findByToken } = await load();
    const net = stubFetch({ "strapi.test/api/newsletter-subscribers": { json: { data: [] } } });
    expect(await findByToken("abc")).toBeNull();
    expect(net.calls[0].url).toContain("filters[confirmToken][$eq]=abc");
  });

  test("blank value short-circuits to null without a request", async () => {
    const { findByEmail } = await load();
    const net = stubFetch({ "strapi.test": { json: {} } });
    expect(await findByEmail("")).toBeNull();
    expect(net.calls).toHaveLength(0);
  });

  test("row mapping defaults: missing status -> pending, unknown source -> footer", async () => {
    const { findByEmail } = await load();
    stubFetch({
      "strapi.test/api/newsletter-subscribers": {
        json: { data: [{ documentId: "d", email: "a@b.co", source: "weird" }] },
      },
    });
    expect(await findByEmail("a@b.co")).toEqual({
      documentId: "d",
      email: "a@b.co",
      status: "pending",
      confirmToken: "",
      source: "footer",
    });
  });

  test("listSubscribers pages oldest-first and drops rows without a documentId", async () => {
    const { listSubscribers } = await load();
    const net = stubFetch({
      "strapi.test/api/newsletter-subscribers": { json: { data: [STRAPI_ROW, { email: "x@y.z" }] } },
    });
    expect(await listSubscribers(2, 50)).toEqual([SUBSCRIBER]);
    expect(net.calls[0].url).toContain("sort=createdAt:asc&pagination[page]=2&pagination[pageSize]=50");
  });
});

describe("writes", () => {
  test("create POSTs {data} with status renamed to subscriptionStatus", async () => {
    const { create } = await load();
    const net = stubFetch({ "strapi.test/api/newsletter-subscribers": { json: { data: STRAPI_ROW } } });
    const out = await create({ email: "jane@example.com", status: "pending", confirmToken: "tok", source: "popup" });
    expect(out).toEqual(SUBSCRIBER);
    const [c] = net.calls;
    expect(c.method).toBe("POST");
    expect(c.url).toBe("http://strapi.test/api/newsletter-subscribers");
    expect(c.headers.authorization).toBe("Bearer test-token");
    expect(c.body).toEqual({
      data: { email: "jane@example.com", subscriptionStatus: "pending", confirmToken: "tok", source: "popup" },
    });
  });

  test("update PUTs to the document and leaves status out when not given", async () => {
    const { update } = await load();
    const net = stubFetch({ "strapi.test/api/newsletter-subscribers/doc1": { json: { data: STRAPI_ROW } } });
    await update("doc1", { confirmedAt: null });
    expect(net.calls[0].method).toBe("PUT");
    expect(net.calls[0].url).toBe("http://strapi.test/api/newsletter-subscribers/doc1");
    expect(net.calls[0].body).toEqual({ data: { confirmedAt: null } });
  });
});

describe("newToken", () => {
  test("is a 43-char base64url string and unique per call", async () => {
    const { newToken } = await load();
    const tokens = new Set(Array.from({ length: 50 }, () => newToken()));
    expect(tokens.size).toBe(50);
    for (const t of tokens) expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe("subscribed cookie", () => {
  test("setSubscribedCookie sets bst_nl=1, HttpOnly, SameSite=Lax, a year, path /", async () => {
    const { setSubscribedCookie, SUBSCRIBED_COOKIE } = await load();
    const res = setSubscribedCookie(NextResponse.json({}));
    const c = res.headers.get("set-cookie") ?? "";
    expect(SUBSCRIBED_COOKIE).toBe("bst_nl");
    expect(c).toMatch(/^bst_nl=1;/);
    expect(c).toMatch(/HttpOnly/i);
    expect(c).toMatch(/SameSite=lax/i);
    expect(c).toMatch(/Path=\//);
    expect(c).toMatch(/Max-Age=31536000/);
    // NODE_ENV is "test" here, so not Secure (it is in production).
    expect(c).not.toMatch(/Secure/i);
  });

  test("clearSubscribedCookie expires it", async () => {
    const { clearSubscribedCookie } = await load();
    const c = clearSubscribedCookie(NextResponse.json({})).headers.get("set-cookie") ?? "";
    expect(c).toMatch(/^bst_nl=;/);
    expect(c).toMatch(/Max-Age=0/);
  });
});
