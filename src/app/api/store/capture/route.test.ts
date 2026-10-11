import { describe, expect, test } from "vitest";
import { CONFIGURED, withEnv } from "../../../../../test/env";
import { networkError, stubFetch } from "../../../../../test/fetch-stub";
import {
  PAYPAL_SANDBOX,
  paypalCaptureCompleted,
  paypalCapturePending,
} from "../../../../../test/fixtures/payments";
import { jsonRequest, rawRequest } from "../../../../../test/request";
import { openShop, shop } from "../../../../../test/shop";

const ENV = { ...CONFIGURED, PAYPAL_CLIENT_ID: "client-id", PAYPAL_CLIENT_SECRET: "s3cret" };
const load = (env: Record<string, string> = ENV) =>
  withEnv(env, async () => {
    openShop(); // the fallback store is "coming soon"; see test/shop.ts
    return import("./route");
  });
const PATH = "/api/store/capture";
const HOODIE = "call-on-jesus-vintage-faded-hoodie";
const cart = [{ slug: HOODIE, size: "M", qty: 1 }];

type Reply = { status?: number; json?: unknown };

// The order PayPal approved, as GET /v2/checkout/orders/{id} returns it (before capture).
const approvedOrder = (value = "50.99", currency = "USD"): Reply => ({
  json: { id: "PAYORDER123", status: "APPROVED", purchase_units: [{ amount: { value, currency_code: currency } }] },
});

// PayPal sandbox: token, the pre-capture order lookup (GET) and the capture (POST). stubFetch takes
// the first matching key, so the `/capture` path is listed before the bare order path.
const paypal = (capture: Reply, approved: Reply = approvedOrder()) => ({
  [`${PAYPAL_SANDBOX}/v1/oauth2/token`]: { json: { access_token: "pp-access" } },
  [`${PAYPAL_SANDBOX}/v2/checkout/orders/PAYORDER123/capture`]: capture,
  [`${PAYPAL_SANDBOX}/v2/checkout/orders/PAYORDER123`]: approved,
});

// Strapi has no store/product rows → priceCart and snapshotItems use the static catalogue
// (hoodie $45 + $5.99 shipping = $50.99).
const services = (capture: unknown, overrides = {}, approved?: Reply) =>
  stubFetch({
    ...paypal({ status: 201, json: capture }, approved),
    "strapi.test/api/orders?": { json: { data: [] } }, // orderExists lookup
    "strapi.test/api/orders": { status: 201, json: { data: {} } }, // saveOrder
    "strapi.test/api/store": { json: { data: null } },
    "strapi.test/api/products": { json: { data: [] } },
    "open.er-api.com": { json: { rates: { GBP: 0.8 } } },
    ...overrides,
  });

const captures = (net: ReturnType<typeof stubFetch>) => net.to("/PAYORDER123/capture");

const saves = (net: ReturnType<typeof stubFetch>) =>
  net.calls.filter((c) => c.method === "POST" && c.url.endsWith("/api/orders"));

describe("POST /api/store/capture (PayPal)", () => {
  test("503 when PayPal isn't configured", async () => {
    const { POST } = await load({ ...CONFIGURED });
    const net = stubFetch({});
    expect((await POST(jsonRequest(PATH, { orderID: "X", items: cart }))).status).toBe(503);
    expect(net.calls).toHaveLength(0);
  });

  test("400 on bad JSON or a missing orderID", async () => {
    const { POST } = await load();
    const net = stubFetch({});
    expect((await POST(rawRequest(PATH, "nope"))).status).toBe(400);
    expect((await POST(jsonRequest(PATH, { items: cart }))).status).toBe(400);
    expect(net.calls).toHaveLength(0);
  });

  test("502 when the capture call fails; nothing saved", async () => {
    const { POST } = await load();
    const net = services({}, paypal({ status: 422, json: { message: "INSTRUMENT_DECLINED" } }));
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }))).status).toBe(502);
    expect(saves(net)).toHaveLength(0);
  });

  test("402 when the capture isn't COMPLETED; nothing saved", async () => {
    const { POST } = await load();
    const net = services(paypalCapturePending());
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }));
    expect(res.status).toBe(402);
    expect(await res.json()).toMatchObject({ status: "PENDING" });
    expect(saves(net)).toHaveLength(0);
  });

  test("200: orderNumber is BST- + last 8 chars of the capture id, uppercased; totals from PayPal", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted("50.99", "USD"));
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart, total: 0.01 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      orderNumber: "BST-ABCDEFGH",
      email: "payer@example.com",
      total: 50.99,
      currency: "USD",
    });

    expect(net.to("/v2/checkout/orders/PAYORDER123/capture")).toHaveLength(1);
    const [save] = saves(net);
    expect(save.headers.authorization).toBe("Bearer test-token");
    expect(save.body).toEqual({
      data: {
        orderNumber: "BST-ABCDEFGH",
        email: "payer@example.com",
        payerName: "Ada Lovelace",
        items: [
          { slug: HOODIE, title: expect.stringContaining("Hooded"), size: "M", qty: 1, unitPrice: 45 },
        ],
        subtotal: 45, // repriced from the catalogue (PayPal's capture omits the breakdown)
        shipping: 5.99,
        total: 50.99, // PayPal's captured amount
        currency: "USD",
        orderStatus: "paid",
        provider: "paypal",
        paypalOrderId: "PAYORDER123",
        paypalCaptureId: "3XY45678abcdefgh",
        shippingAddress: {
          name: "Ada Lovelace",
          address_line_1: "1 Main St",
          admin_area_2: "Springfield",
          country_code: "US",
        },
      },
    });
  });

  test("no capture id → the PayPal order id is the order number", async () => {
    const { POST } = await load();
    const capture = paypalCaptureCompleted();
    capture.purchase_units![0].payments = { captures: [] };
    services(capture);
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }));
    expect((await res.json()).orderNumber).toBe("PAYORDER123");
  });

  test("idempotent: an existing order for this PayPal order id means no second write", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted(), {
      "strapi.test/api/orders?": { json: { data: [{ orderNumber: "BST-ABCDEFGH" }] } },
    });
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }));
    expect(res.status).toBe(200);
    expect(net.to("filters[paypalOrderId][$eq]=PAYORDER123")).toHaveLength(1);
    expect(saves(net)).toHaveLength(0);
  });

  test("a Strapi save failure still returns 200", async () => {
    const { POST } = await load();
    services(paypalCaptureCompleted(), { "strapi.test/api/orders": { status: 500, json: {} } });
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }));
    expect(res.status).toBe(200);
    expect((await res.json()).orderNumber).toBe("BST-ABCDEFGH");
  });

  test("Strapi fully down still returns 200 (catalogue fallback, save skipped by error)", async () => {
    const { POST } = await load();
    services(paypalCaptureCompleted(), { "strapi.test": networkError });
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }))).status).toBe(200);
  });
});

// Anyone holding the public PayPal client id can create an order for any amount and send its id
// here. The route must check the approved amount against the server-repriced cart BEFORE capturing.
describe("POST /api/store/capture: the approved amount must match the cart", () => {
  test("409 and NO capture when a $1 order is presented for a $50.99 cart", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted("1.00", "USD"), {}, approvedOrder("1.00", "USD"));
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/not been charged/);
    expect(net.to("/v2/checkout/orders/PAYORDER123")).toHaveLength(1); // the GET lookup only
    expect(captures(net)).toHaveLength(0);
    expect(saves(net)).toHaveLength(0);
  });

  test("409 when the currency differs, even if the number matches", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted(), {}, approvedOrder("50.99", "EUR"));
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }))).status).toBe(409);
    expect(captures(net)).toHaveLength(0);
  });

  test("an exact match is captured; overpaying is allowed", async () => {
    const { POST } = await load();
    let net = services(paypalCaptureCompleted(), {}, approvedOrder("50.99", "USD"));
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }))).status).toBe(200);
    expect(captures(net)).toHaveLength(1);

    net = services(paypalCaptureCompleted("60.00"), {}, approvedOrder("60.00", "USD"));
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }))).status).toBe(200);
    expect(captures(net)).toHaveLength(1);
  });

  test("the base currency gets no tolerance: one cent short is rejected", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted("50.98"), {}, approvedOrder("50.98", "USD"));
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }))).status).toBe(409);
    expect(captures(net)).toHaveLength(0);
  });

  // GBP at 0.8: hoodie 45 → 36.00, shipping 5.99 → 4.79, so the cart reprices to £40.79.
  test("a converted currency allows up to 2% under (FX refresh), and no more", async () => {
    const { POST } = await load();
    const body = { orderID: "PAYORDER123", items: cart, currency: "GBP" };

    let net = services(paypalCaptureCompleted("40.00", "GBP"), {}, approvedOrder("40.00", "GBP"));
    expect((await POST(jsonRequest(PATH, body))).status).toBe(200); // 1.9% under
    expect(captures(net)).toHaveLength(1);

    net = services(paypalCaptureCompleted("39.90", "GBP"), {}, approvedOrder("39.90", "GBP"));
    expect((await POST(jsonRequest(PATH, body))).status).toBe(409); // 2.2% under
    expect(captures(net)).toHaveLength(0);
  });

  test("a cart that can't be priced never reaches PayPal at all", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted());
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: [{ slug: "the-untitled-book" }] }));
    expect(res.status).toBe(409);
    expect(net.to("paypal.com")).toHaveLength(0);
  });

  test("403 while the store is 'coming soon'; PayPal never called", async () => {
    shop.open = false;
    const { POST } = await load();
    const net = services(paypalCaptureCompleted());
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }))).status).toBe(403);
    expect(net.to("paypal.com")).toHaveLength(0);
  });

  test("502 and no capture when the order lookup itself fails", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted(), {}, { status: 500, json: { message: "boom" } });
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }))).status).toBe(502);
    expect(captures(net)).toHaveLength(0);
  });
});

