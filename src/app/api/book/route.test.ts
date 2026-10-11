import { describe, expect, test } from "vitest";
import { CONFIGURED, withEnv } from "../../../../test/env";
import { networkError, stubFetch } from "../../../../test/fetch-stub";
import { jsonRequest, rawRequest } from "../../../../test/request";

const load = (env: Record<string, string> = CONFIGURED) =>
  withEnv(env, () => import("./route"));

const church = {
  audience: "church",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "555-0100",
  role: "Pastor",
  organization: "Grace Church",
  location: "Austin, TX",
  eventDate: "2026-12-01",
  message: "We'd love to have Caleb speak.",
  attendance: "200-500",
};

const corporate = {
  ...church,
  audience: "corporate",
  organization: "Acme Inc",
  industry: "Tech",
  eventType: "Keynote",
  orgSize: "1000+",
  timeline: "This quarter",
};

const services = (overrides = {}) =>
  stubFetch({
    "strapi.test/api/notification-settings": { json: { data: null } },
    "strapi.test/api/booking-requests": { status: 201, json: { data: {} } },
    "strapi.test/api/book-caleb": { json: { data: null } },
    "api.resend.com/emails": { json: { id: "email_1" } },
    ...overrides,
  });

describe("POST /api/book", () => {
  test("400 on a body that isn't JSON", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(rawRequest("/api/book", "{not json"));
    expect(res.status).toBe(400);
    expect(net.calls).toHaveLength(0);
  });

  test("400 on missing required fields", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/book", { ...church, location: "" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "Please fill in all required fields." });
    expect(net.calls).toHaveLength(0);
  });

  test("400 for corporate without industry/eventType (church doesn't need them)", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/book", { ...corporate, industry: "" }));
    expect(res.status).toBe(400);
    expect(net.calls).toHaveLength(0);
  });

  test("honeypot `website`: reports success but stores and sends nothing", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/book", { ...church, website: "spam.example" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(net.calls).toHaveLength(0);
  });

  test("church: stores the request with the token and emails the pastor", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/book", church));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const [stored] = net.to("/api/booking-requests");
    expect(stored.method).toBe("POST");
    expect(stored.headers.authorization).toBe("Bearer test-token");
    const data = (stored.body as { data: Record<string, string> }).data;
    expect(data).toMatchObject({
      audience: "church",
      name: "Ada Lovelace",
      email: "ada@example.com",
      organization: "Grace Church",
      role: "Pastor",
    });
    expect(data.details).toContain("Average weekend attendance: 200-500");

    const [mail] = net.to("api.resend.com/emails");
    expect(mail.body).toMatchObject({
      to: "contact@test.dev", // CONTACT_TO (no BOOKING_TO in CONFIGURED)
      reply_to: "ada@example.com",
      subject: "[Booking] Speaking request — Ada Lovelace (Grace Church)",
    });
  });

  test("corporate: the corporate extras land in details and the subject uses the event type", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/book", corporate));
    expect(res.status).toBe(200);
    const data = (net.to("/api/booking-requests")[0].body as { data: Record<string, string> }).data;
    expect(data.audience).toBe("corporate");
    expect(data.details).toContain("Industry / type: Tech");
    expect(data.details).toContain("Organization size: 1000+");
    expect(data.details).toContain("Decision timeline: This quarter");
    expect(data.details).not.toContain("attendance");
    expect(net.to("api.resend.com/emails")[0].body).toMatchObject({
      subject: "[Booking] Keynote — Ada Lovelace (Acme Inc)",
    });
  });

  describe("recipient precedence: bookingTo > BOOKING_TO > CONTACT_TO > page email", () => {
    test("admin bookingTo wins over everything", async () => {
      const { POST } = await load({ ...CONFIGURED, BOOKING_TO: "env-book@test.dev" });
      const net = services({
        "strapi.test/api/notification-settings": { json: { data: { bookingTo: "admin@test.dev" } } },
      });
      await POST(jsonRequest("/api/book", church));
      expect(net.to("api.resend.com/emails")[0].body).toMatchObject({ to: "admin@test.dev" });
    });

    test("BOOKING_TO beats CONTACT_TO", async () => {
      const { POST } = await load({ ...CONFIGURED, BOOKING_TO: "env-book@test.dev" });
      const net = services();
      await POST(jsonRequest("/api/book", church));
      expect(net.to("api.resend.com/emails")[0].body).toMatchObject({ to: "env-book@test.dev" });
    });

    test("with no admin/env recipient, falls back to the Book Caleb page's direct email", async () => {
      const { POST } = await load({ ...CONFIGURED, CONTACT_TO: "" });
      const net = services({
        "strapi.test/api/book-caleb": { json: { data: { directEmailAddress: "page@test.dev" } } },
      });
      await POST(jsonRequest("/api/book", church));
      expect(net.to("api.resend.com/emails")[0].body).toMatchObject({ to: "page@test.dev" });
    });
  });

  test("Strapi being down doesn't block the email (store is best-effort)", async () => {
    const { POST } = await load();
    const net = services({
      "strapi.test/api/notification-settings": networkError,
      "strapi.test/api/booking-requests": networkError,
    });
    const res = await POST(jsonRequest("/api/book", church));
    expect(res.status).toBe(200);
    expect(net.to("api.resend.com/emails")).toHaveLength(1);
  });

  test("500 when the email provider rejects the send", async () => {
    const { POST } = await load();
    services({ "api.resend.com/emails": { status: 422, json: {} } });
    const res = await POST(jsonRequest("/api/book", church));
    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });

  test("no Strapi configured: skips the store, still emails", async () => {
    const { POST } = await load({ ...CONFIGURED, STRAPI_URL: "" });
    const net = services();
    const res = await POST(jsonRequest("/api/book", church));
    expect(res.status).toBe(200);
    expect(net.to("strapi.test")).toHaveLength(0);
    expect(net.to("api.resend.com/emails")).toHaveLength(1);
  });
});
