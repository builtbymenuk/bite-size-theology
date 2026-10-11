import { describe, expect, test } from "vitest";
import { CONFIGURED, withEnv } from "../../../../test/env";
import { type Call, networkError, stubFetch } from "../../../../test/fetch-stub";
import { jsonRequest, rawRequest } from "../../../../test/request";

const load = (env: Record<string, string> = CONFIGURED) =>
  withEnv(env, () => import("./route"));

const valid = { name: "Ada", email: "ada@example.com", request: "Please pray for my family." };

const services = (overrides = {}) =>
  stubFetch({
    "strapi.test/api/notification-settings": { json: { data: null } },
    "strapi.test/api/prayer-requests": { status: 201, json: { data: {} } },
    "api.resend.com/emails": { json: { id: "email_1" } },
    ...overrides,
  });

describe("POST /api/prayer", () => {
  test("400 on a body that isn't JSON", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(rawRequest("/api/prayer", "{not json"));
    expect(res.status).toBe(400);
    expect(net.calls).toHaveLength(0);
  });

  test("400 when the request text is missing", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/prayer", { ...valid, request: "  " }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "Please share what we can pray for." });
    expect(net.calls).toHaveLength(0);
  });

  test("400 on an invalid (but present) email", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/prayer", { ...valid, email: "nope" }));
    expect(res.status).toBe(400);
    expect(net.calls).toHaveLength(0);
  });

  test("honeypot `website`: reports success but stores and sends nothing", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/prayer", { ...valid, website: "x" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(net.calls).toHaveLength(0);
  });

  test("stores with the token and emails the team (not urgent)", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/prayer", valid));
    expect(res.status).toBe(200);

    const [stored] = net.to("/api/prayer-requests");
    expect(stored.headers.authorization).toBe("Bearer test-token");
    expect(stored.body).toEqual({
      data: { request: valid.request, name: "Ada", email: "ada@example.com", urgent: false },
    });

    const [mail] = net.to("api.resend.com/emails");
    expect(mail.body).toMatchObject({
      to: "contact@test.dev",
      reply_to: "ada@example.com",
      subject: "[Prayer] Request from Ada",
    });
    expect((mail.body as { text: string }).text).toContain("Urgent: no");
  });

  test("urgent flag prefixes the subject and is stored", async () => {
    const { POST } = await load();
    const net = services();
    await POST(jsonRequest("/api/prayer", { ...valid, urgent: "on" }));
    expect((net.to("/api/prayer-requests")[0].body as { data: { urgent: boolean } }).data.urgent).toBe(true);
    const mail = net.to("api.resend.com/emails")[0].body as { subject: string; text: string };
    expect(mail.subject).toBe("[URGENT] [Prayer] Request from Ada");
    expect(mail.text).toContain("Urgent: YES");
  });

  test("anonymous: name/email omitted from the stored row, no reply_to", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/prayer", { request: valid.request }));
    expect(res.status).toBe(200);
    expect(net.to("/api/prayer-requests")[0].body).toEqual({
      data: { request: valid.request, urgent: false },
    });
    const mail = net.to("api.resend.com/emails")[0].body as Record<string, string>;
    expect(mail.subject).toBe("[Prayer] Request from Anonymous");
    expect(mail).not.toHaveProperty("reply_to");
  });

  describe("recipient precedence: prayerTo > PRAYER_TO > CONTACT_TO", () => {
    test("admin prayerTo wins", async () => {
      const { POST } = await load({ ...CONFIGURED, PRAYER_TO: "env-prayer@test.dev" });
      const net = services({
        "strapi.test/api/notification-settings": { json: { data: { prayerTo: "admin@test.dev" } } },
      });
      await POST(jsonRequest("/api/prayer", valid));
      expect(net.to("api.resend.com/emails")[0].body).toMatchObject({ to: "admin@test.dev" });
    });

    test("PRAYER_TO beats CONTACT_TO", async () => {
      const { POST } = await load({ ...CONFIGURED, PRAYER_TO: "env-prayer@test.dev" });
      const net = services();
      await POST(jsonRequest("/api/prayer", valid));
      expect(net.to("api.resend.com/emails")[0].body).toMatchObject({ to: "env-prayer@test.dev" });
    });
  });

  test.todo("BUG: prayer with no configured recipient sends to an empty address");

  // Documents CURRENT behaviour (src/app/api/prayer/route.ts:52): unlike contact/book there is no
  // final fallback address, so with no admin/env recipient the route still calls Resend with
  // `to: ""`. Resend rejects that, and the visitor gets a 500 for a config problem.
  test("current behaviour: no recipient anywhere -> Resend called with to:'' -> 500", async () => {
    const { POST } = await load({ ...CONFIGURED, CONTACT_TO: "" });
    const net = services({
      "api.resend.com/emails": (c: Call) =>
        (c.body as { to: string }).to ? { json: { id: "x" } } : { status: 422, json: { message: "to required" } },
    });
    const res = await POST(jsonRequest("/api/prayer", valid));
    expect(net.to("api.resend.com/emails")[0].body).toMatchObject({ to: "" });
    expect(res.status).toBe(500);
  });

  test("Strapi being down doesn't block the email (store is best-effort)", async () => {
    const { POST } = await load();
    const net = services({
      "strapi.test/api/notification-settings": networkError,
      "strapi.test/api/prayer-requests": networkError,
    });
    const res = await POST(jsonRequest("/api/prayer", valid));
    expect(res.status).toBe(200);
    expect(net.to("api.resend.com/emails")).toHaveLength(1);
  });

  test("500 when the email provider rejects the send", async () => {
    const { POST } = await load();
    services({ "api.resend.com/emails": { status: 500, json: {} } });
    const res = await POST(jsonRequest("/api/prayer", valid));
    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });
});

describe("form routes without abuse limits", () => {
  test.todo("contact/book/prayer have no rate limit (only the newsletter route uses rate-limit.ts)");
});
