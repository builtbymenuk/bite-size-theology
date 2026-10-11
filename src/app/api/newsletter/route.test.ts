import { beforeEach, describe, expect, test, vi } from "vitest";
import { CONFIGURED, withEnv } from "../../../../test/env";
import { type Call, networkError, stubFetch } from "../../../../test/fetch-stub";
import { jsonRequest, rawRequest } from "../../../../test/request";

const load = (env: Record<string, string> = CONFIGURED) =>
  withEnv(env, () => import("./route"));

const SUBS = "strapi.test/api/newsletter-subscribers";

type Row = { documentId: string; email: string; subscriptionStatus: string; confirmToken: string };

// Strapi's subscriber collection: GET = lookup by email (returns `existing` if given), POST = create,
// PUT = update. Everything else answers OK.
const services = ({ existing, overrides = {} }: { existing?: Row; overrides?: object } = {}) =>
  stubFetch({
    [SUBS]: (c: Call) => {
      if (c.method === "GET") return { json: { data: existing ? [existing] : [] } };
      const data = (c.body as { data: Record<string, unknown> }).data;
      return { json: { data: { documentId: existing?.documentId ?? "new1", ...data } } };
    },
    "api.resend.com/emails": { json: { id: "email_1" } },
    ...overrides,
  });

const signup = (body: object = { email: "Jane@Example.com", source: "popup" }, ip?: string) =>
  jsonRequest("/api/newsletter", body, ip ? { ip } : undefined);

const cookie = (res: Response) => res.headers.get("set-cookie") ?? "";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/newsletter", () => {
  test("400 on a body that isn't JSON", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(rawRequest("/api/newsletter", "{nope"));
    expect(res.status).toBe(400);
    expect(net.calls).toHaveLength(0);
  });

  test("400 on an invalid address", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(signup({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "Please enter a valid email address." });
    expect(net.calls).toHaveLength(0);
  });

  test("honeypot: looks like success ({state:'pending'}) but does nothing", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(signup({ email: "jane@example.com", website: "x" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, state: "pending" });
    expect(cookie(res)).toBe("");
    expect(net.calls).toHaveLength(0);
  });

  test("503 (no calls) when Strapi isn't configured", async () => {
    const { POST } = await load({ ...CONFIGURED, STRAPI_API_TOKEN: "" });
    const net = services();
    const res = await POST(signup());
    expect(res.status).toBe(503);
    expect(net.calls).toHaveLength(0);
  });

  test("new address: creates a pending row, emails a confirm link, sets the cookie", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(signup());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, state: "pending" });

    const [lookup, created] = net.to(SUBS);
    expect(lookup.url).toContain("filters[email][$eq]=jane%40example.com"); // lowercased
    expect(created.method).toBe("POST");
    const data = (created.body as { data: Record<string, string> }).data;
    expect(data).toMatchObject({ email: "jane@example.com", subscriptionStatus: "pending", source: "popup" });
    expect(data.confirmToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Date.parse(data.subscribedAt)).not.toBeNaN();

    const mail = net.to("api.resend.com/emails")[0].body as { to: string; text: string };
    expect(mail.to).toBe("jane@example.com");
    expect(mail.text).toContain(`https://site.test/api/newsletter/confirm?token=${data.confirmToken}`);

    const c = cookie(res);
    expect(c).toMatch(/^bst_nl=1;/);
    expect(c).toMatch(/HttpOnly/i);
    expect(c).toMatch(/SameSite=lax/i);
  });

  test("already active: {state:'duplicate'} + cookie, no write and no email", async () => {
    const { POST } = await load();
    const net = services({
      existing: { documentId: "d1", email: "jane@example.com", subscriptionStatus: "active", confirmToken: "old" },
    });
    const res = await POST(signup());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, state: "duplicate" });
    expect(cookie(res)).toMatch(/^bst_nl=1;.*HttpOnly/i);
    expect(net.calls.map((c) => c.method)).toEqual(["GET"]);
    expect(net.to("api.resend.com")).toHaveLength(0);
  });

  test("existing pending: rotates the token with a PUT and re-sends the confirmation", async () => {
    const { POST } = await load();
    const net = services({
      existing: { documentId: "d1", email: "jane@example.com", subscriptionStatus: "pending", confirmToken: "old" },
    });
    const res = await POST(signup());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, state: "pending" });

    const put = net.calls.find((c) => c.method === "PUT")!;
    expect(put.url).toBe("http://strapi.test/api/newsletter-subscribers/d1");
    const data = (put.body as { data: Record<string, unknown> }).data;
    expect(data).toMatchObject({ subscriptionStatus: "pending", confirmedAt: null, source: "popup" });
    expect(data.confirmToken).not.toBe("old");
    expect(data.confirmToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const mail = net.to("api.resend.com/emails")[0].body as { text: string };
    expect(mail.text).toContain(`token=${data.confirmToken}`);
    expect(mail.text).not.toContain("token=old");
  });

  test("429 on the 6th signup from one IP within the hour", async () => {
    const { POST } = await load();
    services();
    for (let i = 0; i < 5; i++) {
      const res = await POST(signup({ email: `user${i}@example.com` }, "198.51.100.1"));
      expect(res.status).toBe(200);
    }
    const blocked = await POST(signup({ email: "user5@example.com" }, "198.51.100.1"));
    expect(blocked.status).toBe(429);
    // A different IP is a different bucket.
    expect((await POST(signup({ email: "user6@example.com" }, "198.51.100.2"))).status).toBe(200);
  });

  test("429 on the 4th confirmation for one address, even across IPs", async () => {
    const { POST } = await load();
    const net = services();
    for (let i = 0; i < 3; i++) {
      expect((await POST(signup(undefined, `198.51.100.${10 + i}`))).status).toBe(200);
    }
    const res = await POST(signup(undefined, "198.51.100.99"));
    expect(res.status).toBe(429);
    expect(net.to("api.resend.com/emails")).toHaveLength(3);
  });

  test("500 when the confirmation email can't be sent (and no cookie)", async () => {
    const { POST } = await load();
    services({ overrides: { "api.resend.com/emails": { status: 500, json: {} } } });
    const res = await POST(signup());
    expect(res.status).toBe(500);
    expect(cookie(res)).toBe("");
  });

  test.each([
    ["a 500", { status: 500, json: {} }],
    ["a network error", networkError],
  ] as const)("500 when Strapi fails with %s (the row IS the subscription)", async (_l, reply) => {
    const { POST } = await load();
    const net = stubFetch({ [SUBS]: reply, "api.resend.com/emails": { json: {} } });
    const res = await POST(signup());
    expect(res.status).toBe(500);
    expect(net.to("api.resend.com")).toHaveLength(0);
  });
});
