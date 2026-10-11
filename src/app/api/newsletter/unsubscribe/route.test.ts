import { beforeEach, describe, expect, test, vi } from "vitest";
import { CONFIGURED, withEnv } from "../../../../../test/env";
import { type Call, stubFetch } from "../../../../../test/fetch-stub";
import { getRequest } from "../../../../../test/request";

const load = (env: Record<string, string> = CONFIGURED) =>
  withEnv(env, () => import("./route"));

const SUBS = "strapi.test/api/newsletter-subscribers";
const DONE = "https://site.test/newsletter/unsubscribed";

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
        : { json: { data: { ...existing, subscriptionStatus: "unsubscribed" } } },
    "api.resend.com/contacts": { json: {} },
    ...overrides,
  });

const unsubscribe = (token?: string) =>
  getRequest(`/api/newsletter/unsubscribe${token === undefined ? "" : `?token=${token}`}`);

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/newsletter/unsubscribe", () => {
  test("missing token -> state=invalid, no calls", async () => {
    const { GET } = await load();
    const net = services();
    const res = await GET(unsubscribe());
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`${DONE}?state=invalid`);
    expect(net.calls).toHaveLength(0);
  });

  test("Strapi not configured -> state=invalid, no calls", async () => {
    const { GET } = await load({ ...CONFIGURED, STRAPI_API_TOKEN: "" });
    const net = services();
    expect((await GET(unsubscribe("tok123"))).headers.get("location")).toBe(`${DONE}?state=invalid`);
    expect(net.calls).toHaveLength(0);
  });

  test("unknown token -> state=invalid", async () => {
    const { GET } = await load();
    const net = services();
    const res = await GET(unsubscribe("nope"));
    expect(res.headers.get("location")).toBe(`${DONE}?state=invalid`);
    expect(net.to("api.resend.com")).toHaveLength(0);
  });

  test("active -> unsubscribed in Strapi + flagged in Resend, cookie cleared", async () => {
    const { GET } = await load();
    const net = services(row("active"));
    const res = await GET(unsubscribe("tok123"));
    expect(res.headers.get("location")).toBe(DONE);
    const c = res.headers.get("set-cookie") ?? "";
    expect(c).toMatch(/^bst_nl=;/);
    expect(c).toMatch(/Max-Age=0/);

    const put = net.calls.find((x) => x.method === "PUT")!;
    expect(put.url).toBe("http://strapi.test/api/newsletter-subscribers/d1");
    expect(put.body).toEqual({ data: { subscriptionStatus: "unsubscribed" } });

    const [contact] = net.to("api.resend.com/contacts");
    expect(contact).toMatchObject({
      method: "PATCH",
      url: "https://api.resend.com/contacts/jane%40example.com",
      body: { unsubscribed: true },
    });
  });

  test("already unsubscribed -> no Strapi write, but Resend flag re-asserted and cookie cleared", async () => {
    const { GET } = await load();
    const net = services(row("unsubscribed"));
    const res = await GET(unsubscribe("tok123"));
    expect(res.headers.get("location")).toBe(DONE);
    expect(res.headers.get("set-cookie")).toMatch(/Max-Age=0/);
    expect(net.calls.some((x) => x.method === "PUT")).toBe(false);
    expect(net.to("api.resend.com/contacts")).toHaveLength(1);
  });

  test("Resend failure is best-effort: still redirects to success", async () => {
    const { GET } = await load();
    services(row("active"), { "api.resend.com/contacts": { status: 500, json: {} } });
    expect((await GET(unsubscribe("tok123"))).headers.get("location")).toBe(DONE);
  });

  test("Strapi throws -> state=error, cookie untouched", async () => {
    const { GET } = await load();
    services(undefined, { [SUBS]: { status: 503, json: {} } });
    const res = await GET(unsubscribe("tok123"));
    expect(res.headers.get("location")).toBe(`${DONE}?state=error`);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
