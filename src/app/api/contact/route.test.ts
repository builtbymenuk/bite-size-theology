import { describe, expect, test } from "vitest";
import { CONFIGURED, withEnv } from "../../../../test/env";
import { networkError, stubFetch } from "../../../../test/fetch-stub";
import { jsonRequest, rawRequest } from "../../../../test/request";

const load = (env: Record<string, string> = CONFIGURED) =>
  withEnv(env, () => import("./route"));

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Speaking",
  message: "Hello there, I would love to talk.",
};

// The services this route can reach, all answering "OK" by default.
const services = (overrides = {}) =>
  stubFetch({
    "strapi.test/api/notification-settings": { json: { data: null } },
    "strapi.test/api/contact-messages": { status: 201, json: { data: {} } },
    "strapi.test/api/contact": { json: { data: null } },
    "api.resend.com/emails": { json: { id: "email_1" } },
    ...overrides,
  });

describe("POST /api/contact", () => {
  test("400 on a body that isn't JSON", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(rawRequest("/api/contact", "{not json"));
    expect(res.status).toBe(400);
    expect(net.calls).toHaveLength(0);
  });

  test("400 with the validation message on invalid input", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/contact", { ...valid, email: "nope" }));
    expect(res.status).toBe(400);
    expect((await res.json()).ok).toBe(false);
    expect(net.calls).toHaveLength(0);
  });

  test("honeypot: reports success but stores and sends nothing", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/contact", { ...valid, company: "Spam Inc" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(net.calls).toHaveLength(0);
  });

  test("stores the message with the API token and emails the configured recipient", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest("/api/contact", valid));
    expect(res.status).toBe(200);

    const [stored] = net.to("/api/contact-messages");
    expect(stored.method).toBe("POST");
    expect(stored.headers.authorization).toBe("Bearer test-token");
    expect(stored.body).toEqual({ data: valid });

    const [mail] = net.to("api.resend.com/emails");
    expect(mail.headers.authorization).toBe("Bearer re_test");
    expect(mail.body).toMatchObject({
      to: "contact@test.dev",
      reply_to: "ada@example.com",
      subject: "[Contact] Speaking — Ada Lovelace",
    });
  });

  test("the admin recipient override beats the CONTACT_TO env var", async () => {
    const { POST } = await load();
    const net = services({
      "strapi.test/api/notification-settings": { json: { data: { contactTo: "admin@test.dev" } } },
    });
    await POST(jsonRequest("/api/contact", valid));
    expect(net.to("api.resend.com/emails")[0].body).toMatchObject({ to: "admin@test.dev" });
  });

  test("Strapi being down doesn't block the email (store is best-effort)", async () => {
    const { POST } = await load();
    const net = services({
      "strapi.test/api/notification-settings": networkError,
      "strapi.test/api/contact-messages": networkError,
    });
    const res = await POST(jsonRequest("/api/contact", valid));
    expect(res.status).toBe(200);
    expect(net.to("api.resend.com/emails")).toHaveLength(1);
  });

  test("500 when the email provider rejects the send", async () => {
    const { POST } = await load();
    services({ "api.resend.com/emails": { status: 422, json: { message: "bad from" } } });
    const res = await POST(jsonRequest("/api/contact", valid));
    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });

  test("500 (not a crash) when no email provider is configured", async () => {
    const { POST } = await load({ ...CONFIGURED, RESEND_API_KEY: "" });
    const net = services();
    const res = await POST(jsonRequest("/api/contact", valid));
    expect(res.status).toBe(500);
    expect(net.to("api.resend.com")).toHaveLength(0);
  });

  test("duplicate submissions are each stored and sent (no dedupe exists)", async () => {
    const { POST } = await load();
    const net = services();
    await POST(jsonRequest("/api/contact", valid));
    await POST(jsonRequest("/api/contact", valid));
    expect(net.to("/api/contact-messages")).toHaveLength(2);
    expect(net.to("api.resend.com/emails")).toHaveLength(2);
  });
});
