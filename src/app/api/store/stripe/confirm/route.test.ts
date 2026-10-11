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
const PATH = "/api/store/stripe/confirm";

const services = (overrides = {}) =>
  stubFetch({
    "strapi.test/api/orders?": { json: { data: [] } },
    "strapi.test/api/orders": { status: 201, json: { data: {} } },
    ...overrides,
  });

const saves = (net: ReturnType<typeof stubFetch>) =>
  net.calls.filter((c) => c.method === "POST" && c.url.endsWith("/api/orders"));

beforeEach(() => {
  stripe.stripeConfigured.mockReset().mockReturnValue(true);
  stripe.retrieveSession.mockReset().mockResolvedValue(stripeSessionPaid());
});

describe("POST /api/store/stripe/confirm", () => {
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
    expect((await POST(jsonRequest(PATH, { session_id: "" }))).status).toBe(400);
    expect(stripe.retrieveSession).not.toHaveBeenCalled();
  });

  test("502 when retrieve throws", async () => {
    stripe.retrieveSession.mockRejectedValue(new Error("boom"));
    const { POST } = await load();
    const net = services();
    expect((await POST(jsonRequest(PATH, { session_id: "cs_1" }))).status).toBe(502);
    expect(net.calls).toHaveLength(0);
  });

  test("402 when unpaid; nothing saved", async () => {
    stripe.retrieveSession.mockResolvedValue(stripeSessionUnpaid());
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest(PATH, { session_id: "cs_test_123" }));
    expect(res.status).toBe(402);
    expect(net.calls).toHaveLength(0);
  });

  test("saves the order from Stripe's amounts + collected shipping details", async () => {
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest(PATH, { session_id: "cs_test_123" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      orderNumber: "BST-12345678",
      email: "card@example.com",
      total: 80.99,
      currency: "USD",
    });

    const [save] = saves(net);
    expect(save.headers.authorization).toBe("Bearer test-token");
    expect(save.body).toEqual({
      data: {
        orderNumber: "BST-12345678",
        email: "card@example.com",
        payerName: "Ship To Name",
        items: [
          { slug: "call-on-jesus-vintage-faded-hoodie", title: "Hoodie", size: "M", qty: 1, unitPrice: 45 },
          // unexpanded product → no metadata/name, falls back to the line description
          { slug: null, title: "Tee", size: null, qty: 1, unitPrice: 30 },
        ],
        subtotal: 75,
        shipping: 5.99,
        total: 80.99,
        currency: "USD",
        orderStatus: "paid",
        provider: "stripe",
        stripeSessionId: "cs_test_123",
        stripePaymentIntentId: "pi_3abcdefgh12345678",
        shippingAddress: {
          name: "Ship To Name",
          line1: "2 High St",
          city: "London",
          country: "GB",
          postal_code: "N1",
          line2: null,
          state: null,
        },
      },
    });
  });

  test("without collected shipping details, falls back to customer_details; no PI → session id", async () => {
    stripe.retrieveSession.mockResolvedValue(
      stripeSessionPaid({ collected_information: null, payment_intent: null }),
    );
    const { POST } = await load();
    const net = services();
    const res = await POST(jsonRequest(PATH, { session_id: "cs_test_123" }));
    expect((await res.json()).orderNumber).toBe("cs_test_123");
    expect(saves(net)[0].body).toMatchObject({
      data: { payerName: "Card Holder", shippingAddress: { name: "Card Holder" }, stripePaymentIntentId: "" },
    });
  });

  test("idempotent: returns the EXISTING order's fields and writes nothing", async () => {
    const { POST } = await load();
    const net = services({
      "strapi.test/api/orders?": {
        json: { data: [{ orderNumber: "BST-OLDONE01", email: "old@example.com", total: 12.34, currency: "GBP" }] },
      },
    });
    const res = await POST(jsonRequest(PATH, { session_id: "cs_test_123" }));
    expect(await res.json()).toEqual({
      ok: true,
      orderNumber: "BST-OLDONE01",
      email: "old@example.com",
      total: 12.34,
      currency: "GBP",
    });
    expect(net.to("filters[stripeSessionId][$eq]=cs_test_123")).toHaveLength(1);
    expect(saves(net)).toHaveLength(0);
  });

  test("a Strapi save failure still returns 200", async () => {
    const { POST } = await load();
    services({ "strapi.test/api/orders": { status: 500, json: {} } });
    const res = await POST(jsonRequest(PATH, { session_id: "cs_test_123" }));
    expect(res.status).toBe(200);
    expect((await res.json()).orderNumber).toBe("BST-12345678");
  });

  test("documents the zero-decimal bug: a ¥7,750 JPY session is reported/saved as 77.5", async () => {
    stripe.retrieveSession.mockResolvedValue(
      stripeSessionPaid({ currency: "jpy", amount_total: 7750, amount_subtotal: 6840 }),
    );
    const { POST } = await load();
    services();
    const res = await POST(jsonRequest(PATH, { session_id: "cs_test_123" }));
    expect(await res.json()).toMatchObject({ total: 77.5, currency: "JPY" });
  });

  test.todo(
    "BUG: store/stripe/confirm divides amounts by 100 regardless of currency — JPY (zero-decimal) orders are recorded 100× too small",
  );
});
