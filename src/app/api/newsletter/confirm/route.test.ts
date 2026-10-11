import { beforeEach, describe, expect, test, vi } from "vitest";
import { CONFIGURED, withEnv } from "../../../../../test/env";
import { type Call, networkError, stubFetch } from "../../../../../test/fetch-stub";
import { getRequest } from "../../../../../test/request";

const load = (env: Record<string, string> = CONFIGURED) =>
  withEnv(env, () => import("./route"));

const SUBS = "strapi.test/api/newsletter-subscribers";
const DONE = "https://site.test/newsletter/confirmed";

const row = (subscriptionStatus: string) => ({
  documentId: "d1",
  email: "jane@example.com",
  subscriptionStatus,
  confirmToken: "tok123",
});

const services = (existing?: ReturnType<typeof row>, overrides = {}) =>
  stubFetch({
    [SUBS]: (c: Call) =>
      c.method === "GET"
        ? { json: { data: existing ? [existing] : [] } }
        : { json: { data: { ...existing, subscriptionStatus: "active" } } },
    "api.resend.com/emails": { json: { id: "e1" } },
    "api.resend.com/contacts": { json: { id: "c1" } },
    ...overrides,
  });

const confirm = (token?: string) =>
  getRequest(`/api/newsletter/confirm${token === undefined ? "" : `?token=${token}`}`);

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/newsletter/confirm", () => {
  test.each([undefined, "", "%20"])("missing/blank token (%j) -> state=invalid, no calls", async (t) => {
    const { GET } = await load();
    const net = services();
    const res = await GET(confirm(t));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`${DONE}?state=invalid`);
    expect(net.calls).toHaveLength(0);
  });

  test("Strapi not configured -> state=invalid, no calls", async () => {
    const { GET } = await load({ ...CONFIGURED, STRAPI_URL: "" });
    const net = services();
    const res = await GET(confirm("tok123"));
    expect(res.headers.get("location")).toBe(`${DONE}?state=invalid`);
    expect(net.calls).toHaveLength(0);
  });

  test("unknown token -> state=invalid, nothing written", async () => {
    const { GET } = await load();
    const net = services(undefined);
    const res = await GET(confirm("nope"));
    expect(res.headers.get("location")).toBe(`${DONE}?state=invalid`);
    expect(net.calls.map((c) => c.method)).toEqual(["GET"]);
  });

  test("unsubscribed row (old link) -> state=invalid, not re-subscribed", async () => {
    const { GET } = await load();
    const net = services(row("unsubscribed"));
    const res = await GET(confirm("tok123"));
    expect(res.headers.get("location")).toBe(`${DONE}?state=invalid`);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(net.calls.map((c) => c.method)).toEqual(["GET"]);
  });

  test("pending -> active + confirmedAt, welcome email, Resend contact, cookie, plain redirect", async () => {
    const { GET } = await load();
    const net = services(row("pending"));
    const res = await GET(confirm("tok123"));
    expect(res.headers.get("location")).toBe(DONE);
    expect(res.headers.get("set-cookie")).toMatch(/^bst_nl=1;.*HttpOnly/i);

    expect(net.to(SUBS)[0].url).toContain("filters[confirmToken][$eq]=tok123");
    const put = net.calls.find((c) => c.method === "PUT")!;
    expect(put.url).toBe("http://strapi.test/api/newsletter-subscribers/d1");
    const data = (put.body as { data: Record<string, string> }).data;
    expect(data.subscriptionStatus).toBe("active");
    expect(Date.parse(data.confirmedAt)).not.toBeNaN();

    const mail = net.to("api.resend.com/emails")[0].body as { to: string; text: string };
    expect(mail.to).toBe("jane@example.com");
    expect(mail.text).toContain("https://site.test/api/newsletter/unsubscribe?token=tok123");

    const [contact] = net.to("api.resend.com/contacts");
    expect(contact.method).toBe("POST");
    expect(contact.body).toMatchObject({ email: "jane@example.com", unsubscribed: false });
  });

  test("already active -> redirect without state + cookie, nothing re-sent", async () => {
    const { GET } = await load();
    const net = services(row("active"));
    const res = await GET(confirm("tok123"));
    expect(res.headers.get("location")).toBe(DONE);
    expect(res.headers.get("set-cookie")).toMatch(/^bst_nl=1;/);
    expect(net.calls.map((c) => c.method)).toEqual(["GET"]);
  });

  test("welcome email / Resend contact failures don't undo the confirmation", async () => {
    const { GET } = await load();
    services(row("pending"), {
      "api.resend.com/emails": networkError,
      "api.resend.com/contacts": { status: 500, json: {} },
    });
    const res = await GET(confirm("tok123"));
    expect(res.headers.get("location")).toBe(DONE);
  });

  test("Strapi throws -> state=error", async () => {
    const { GET } = await load();
    services(undefined, { [SUBS]: { status: 500, json: {} } });
    const res = await GET(confirm("tok123"));
    expect(res.headers.get("location")).toBe(`${DONE}?state=error`);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
