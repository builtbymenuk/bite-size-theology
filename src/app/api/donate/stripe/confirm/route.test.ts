import { beforeEach, describe, expect, test, vi } from "vitest";
import { CONFIGURED, withEnv } from "../../../../../../test/env";
import { stubFetch } from "../../../../../../test/fetch-stub";
import { stripeSessionPaid, stripeSessionUnpaid } from "../../../../../../test/fixtures/payments";
import { jsonRequest, rawRequest } from "../../../../../../test/request";

const stripe = vi.hoisted(() => ({
  stripeConfigured: vi.fn(),
  retrieveSession: vi.fn(),
}));
vi.mock("@/lib/stripe", () => stripe);

const load = () => withEnv(CONFIGURED, () => import("./route"));
const PATH = "/api/donate/stripe/confirm";

const donationSession = (overrides: Record<string, unknown> = {}) =>
  stripeSessionPaid({
    amount_total: 2550,
    currency: "usd",
    payment_intent: "pi_donation_1",
    metadata: { name: "Ada", email: "ada@example.com", fund: "Missions", message: "Hi", anonymous: "" },
    ...overrides,
  });

const services = (overrides = {}) =>
  stubFetch({
    "strapi.test/api/donations?": { json: { data: [] } },
    "strapi.test/api/donations": { status: 201, json: { data: {} } },
    ...overrides,
  });

const saves = (net: ReturnType<typeof stubFetch>) =>
  net.calls.filter((c) => c.method === "POST" && c.url.endsWith("/api/donations"));

beforeEach(() => {
  stripe.stripeConfigured.mockReset().mockReturnValue(true);
  stripe.retrieveSession.mockReset().mockResolvedValue(donationSession());
});

describe("POST /api/donate/stripe/confirm", () => {
  test("503 when Stripe isn't configured", async () => {
    stripe.stripeConfigured.mockReturnValue(false);
    const { POST } = await load();
    const net = services();
    expect((await POST(jsonRequest(PATH, { session_id: "cs_1" }))).status).toBe(503);
    expect(net.calls).toHaveLength(0);
  });

  test("400 on bad JSON or a missing session_id", async () => {
    const { POST } = await load();
    services();
    expect((await POST(rawRequest(PATH, "{"))).status).toBe(400);
    expect((await POST(jsonRequest(PATH, {}))).status).toBe(400);
    expect(stripe.retrieveSession).not.toHaveBeenCalled();
  });

  test("502 when retrieving the session throws", async () => {
    stripe.retrieveSession.mockRejectedValue(new Error("No such session"));
    const { POST } = await load();
    const net = services();
    expect((await POST(jsonRequest(PATH, { session_id: "cs_bad" }))).status).toBe(502);
    expect(net.calls).toHaveLength(0);
  });

  test("402 when the session isn't paid; nothing is saved", async () => {
    stripe.retrieveSession.mockResolvedValue(stripeSessionUnpaid());
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest(PATH, { session_id: "cs_test_123" }));
    expect(res.status).toBe(402);
    expect((await res.json()).status).toBe("unpaid");
    expect(net.calls).toHaveLength(0);
  });

  test("saves the donation with STRIPE's amount and returns it", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest(PATH, { session_id: "cs_test_123", amount: 1 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, amount: 25.5, currency: "USD" });
    expect(stripe.retrieveSession).toHaveBeenCalledWith("cs_test_123");

    const [save] = saves(net);
    expect(save.headers.authorization).toBe("Bearer test-token");
    expect(save.body).toEqual({
      data: {
        amount: 25.5,
        currency: "USD",
        name: "Ada",
        email: "ada@example.com",
        fund: "Missions",
        message: "Hi",
        anonymous: false,
        provider: "stripe",
        donationStatus: "completed",
        stripeSessionId: "cs_test_123",
        stripePaymentIntentId: "pi_donation_1",
      },
    });
  });

  test("anonymous metadata hides the name; customer_details fill a blank email", async () => {
    stripe.retrieveSession.mockResolvedValue(
      donationSession({ metadata: { anonymous: "true" }, payment_intent: { id: "pi_obj" } }),
    );
    const { POST } = await load();
    const net = services();
    await POST(jsonRequest(PATH, { session_id: "cs_test_123" }));
    const data = (saves(net)[0].body as { data: Record<string, unknown> }).data;
    expect(data).toMatchObject({ anonymous: true, email: "card@example.com", stripePaymentIntentId: "pi_obj" });
    expect(data).not.toHaveProperty("name");
  });

  test("idempotent: an existing donation for this session means no second write", async () => {
    const { POST } = await load();
    const net = services({ "strapi.test/api/donations?": { json: { data: [{ documentId: "d1" }] } } });
    const res = await POST(jsonRequest(PATH, { session_id: "cs_test_123" }));
    expect(res.status).toBe(200);
    expect(net.to("filters[stripeSessionId][$eq]=cs_test_123")).toHaveLength(1);
    expect(saves(net)).toHaveLength(0);
  });

  test("a Strapi save failure still returns 200", async () => {
    const { POST } = await load();
    services({ "strapi.test/api/donations": { status: 500, json: {} } });
    const res = await POST(jsonRequest(PATH, { session_id: "cs_test_123" }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
});
