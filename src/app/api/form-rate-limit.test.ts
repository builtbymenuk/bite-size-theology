// The three inbox-bound form routes share one abuse limit: 5 submissions per IP per hour, checked
// after the honeypot. One file covers all three so the contract can't drift between them.
import { describe, expect, test } from "vitest";
import { CONFIGURED, withEnv } from "../../../test/env";
import { stubFetch } from "../../../test/fetch-stub";
import { jsonRequest } from "../../../test/request";

const FORMS = [
  {
    path: "/api/contact",
    load: () => withEnv(CONFIGURED, () => import("./contact/route")),
    valid: { name: "Ada", email: "ada@example.com", subject: "Hi", message: "Hello there, friend." },
    honeypot: { company: "Spam Inc" },
  },
  {
    path: "/api/book",
    load: () => withEnv(CONFIGURED, () => import("./book/route")),
    valid: {
      audience: "church",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "555-0100",
      role: "Pastor",
      organization: "Grace Church",
      location: "Atlanta, GA",
      eventDate: "2027-01-10",
      message: "We'd love to have Caleb speak.",
    },
    honeypot: { website: "http://spam.test" },
  },
  {
    path: "/api/prayer",
    load: () => withEnv(CONFIGURED, () => import("./prayer/route")),
    valid: { name: "Ada", email: "ada@example.com", request: "Please pray for my family." },
    honeypot: { website: "http://spam.test" },
  },
];

const services = () =>
  stubFetch({
    "strapi.test/api/notification-settings": { json: { data: null } },
    "strapi.test/api": { status: 201, json: { data: null } },
    "api.resend.com/emails": { json: { id: "email_1" } },
  });

describe.each(FORMS)("$path rate limit", ({ path, load, valid, honeypot }) => {
  test("5 per IP per hour; the 6th gets 429 and stores/sends nothing", async () => {
    const { POST } = await load();
    const net = services();
    for (let i = 0; i < 5; i++) {
      expect((await POST(jsonRequest(path, valid, { ip: "198.51.100.1" }))).status).toBe(200);
    }
    const before = net.calls.length;
    const res = await POST(jsonRequest(path, valid, { ip: "198.51.100.1" }));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ ok: false, error: "Too many requests. Please try again later." });
    expect(net.calls).toHaveLength(before); // no Strapi write, no email

    // A different visitor is unaffected.
    expect((await POST(jsonRequest(path, valid, { ip: "198.51.100.2" }))).status).toBe(200);
  });

  test("a limited IP still gets the honeypot's silent success (bots learn nothing)", async () => {
    const { POST } = await load();
    services();
    for (let i = 0; i < 5; i++) await POST(jsonRequest(path, valid, { ip: "198.51.100.3" }));
    const res = await POST(jsonRequest(path, { ...valid, ...honeypot }, { ip: "198.51.100.3" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
