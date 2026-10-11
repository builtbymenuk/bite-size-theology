import { describe, expect, test } from "vitest";
import { CONFIGURED, withEnv } from "../../../../../test/env";
import { networkError, stubFetch } from "../../../../../test/fetch-stub";
import {
  paypalCaptureCompleted,
  paypalCapturePending,
  paypalRoutes,
} from "../../../../../test/fixtures/payments";
import { jsonRequest, rawRequest } from "../../../../../test/request";

const ENV = { ...CONFIGURED, PAYPAL_CLIENT_ID: "client-id", PAYPAL_CLIENT_SECRET: "s3cret" };
const load = (env: Record<string, string> = ENV) => withEnv(env, () => import("./route"));
const PATH = "/api/store/capture";
const HOODIE = "call-on-jesus-vintage-faded-hoodie";
const cart = [{ slug: HOODIE, size: "M", qty: 1 }];

// Strapi has no store/product rows → priceCart and snapshotItems use the static catalogue.
const services = (capture: unknown, overrides = {}) =>
  stubFetch({
    ...paypalRoutes({ status: 201, json: capture }),
    "strapi.test/api/orders?": { json: { data: [] } }, // orderExists lookup
    "strapi.test/api/orders": { status: 201, json: { data: {} } }, // saveOrder
    "strapi.test/api/store": { json: { data: null } },
    "strapi.test/api/products": { json: { data: [] } },
    ...overrides,
  });

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
    const net = services({}, paypalRoutes({ status: 422, json: { message: "INSTRUMENT_DECLINED" } }));
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }))).status).toBe(502);
    expect(net.to("strapi.test")).toHaveLength(0);
  });

  test("402 when the capture isn't COMPLETED; nothing saved", async () => {
    const { POST } = await load();
    const net = services(paypalCapturePending());
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }));
    expect(res.status).toBe(402);
    expect(await res.json()).toMatchObject({ status: "PENDING" });
    expect(net.to("strapi.test")).toHaveLength(0);
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

  test("documents the gap: a capture for $1 against a $50.99 cart is accepted and saved as paid", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted("1.00", "USD"));
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123", items: cart }));
    expect(res.status).toBe(200);
    expect(saves(net)[0].body).toMatchObject({
      data: { subtotal: 45, shipping: 5.99, total: 1, orderStatus: "paid" },
    });
  });

  test.todo("BUG: store capture does not compare the captured total with a server-repriced cart");
});
