import { describe, expect, test } from "vitest";
import { withEnv } from "../../../../../test/env";
import { networkError, stubFetch } from "../../../../../test/fetch-stub";
import { paypalRoutes } from "../../../../../test/fixtures/payments";
import { jsonRequest, rawRequest } from "../../../../../test/request";

// No STRAPI_URL → the static catalogue prices the cart (hoodie $45, sticker $7, shipping $5.99).
const PAYPAL = { PAYPAL_CLIENT_ID: "client-id", PAYPAL_CLIENT_SECRET: "s3cret" };
const load = (env: Record<string, string> = PAYPAL) => withEnv(env, () => import("./route"));
const PATH = "/api/store/checkout";
const HOODIE = "call-on-jesus-vintage-faded-hoodie";
const STICKER = "honk-if-you-love-jesus-bumper-sticker";

type OrderBody = {
  purchase_units: Array<{
    amount: { currency_code: string; value: string; breakdown: Record<string, { value: string }> };
    items: Array<{ name: string; quantity: string; unit_amount: { value: string }; description?: string }>;
  }>;
};

describe("POST /api/store/checkout (PayPal create)", () => {
  test("503 when PayPal isn't configured", async () => {
    const { POST } = await load({});
    const net = stubFetch({});
    expect((await POST(jsonRequest(PATH, { items: [{ slug: STICKER }] }))).status).toBe(503);
    expect(net.calls).toHaveLength(0);
  });

  test("400 on bad JSON", async () => {
    const { POST } = await load();
    stubFetch({});
    expect((await POST(rawRequest(PATH, "]["))).status).toBe(400);
  });

  test.each([
    ["empty cart", [], 400],
    ["missing size", [{ slug: HOODIE, qty: 1 }], 400],
    ["unknown slug", [{ slug: "ghost", qty: 1 }], 409],
    ["sold out", [{ slug: "the-untitled-book", qty: 1 }], 409],
  ])("%s → %i from priceCart, PayPal never called", async (_label, items, status) => {
    const { POST } = await load();
    const net = stubFetch({});
    const res = await POST(jsonRequest(PATH, { items }));
    expect(res.status).toBe(status);
    expect((await res.json()).error).toBeTruthy();
    expect(net.calls).toHaveLength(0);
  });

  test("the PayPal order carries the SERVER-repriced amounts; tampered client prices are ignored", async () => {
    const { POST } = await load();
    const net = stubFetch(paypalRoutes({ status: 201, json: { id: "ORDER-9", status: "CREATED" } }));
    const res = await POST(
      jsonRequest(PATH, {
        items: [
          { slug: HOODIE, size: "XL", qty: 2, price: 0.01, unitPrice: 0.01 },
          { slug: STICKER, qty: 3, price: 0 },
        ],
        total: "0.01",
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "ORDER-9" });

    const body = net.to("/v2/checkout/orders")[0].body as OrderBody;
    const pu = body.purchase_units[0];
    expect(pu.amount).toEqual({
      currency_code: "USD",
      value: "116.99",
      breakdown: {
        item_total: { currency_code: "USD", value: "111.00" },
        shipping: { currency_code: "USD", value: "5.99" },
      },
    });
    expect(pu.items.map((i) => [i.quantity, i.unit_amount.value, i.description])).toEqual([
      ["2", "45.00", "Size: XL"],
      ["3", "7.00", undefined],
    ]);
  });

  test("a supported currency reaches PayPal converted (rates outage → fallback table)", async () => {
    const { POST } = await load();
    const net = stubFetch({
      "open.er-api.com": networkError,
      ...paypalRoutes({ json: { id: "ORDER-JPY" } }),
    });
    const res = await POST(jsonRequest(PATH, { items: [{ slug: STICKER, qty: 1 }], currency: "JPY" }));
    expect(res.status).toBe(200);
    const pu = (net.to("/v2/checkout/orders")[0].body as OrderBody).purchase_units[0];
    // 7 × 152 = 1064; 5.99 × 152 → 910; JPY has no decimals
    expect(pu.amount.currency_code).toBe("JPY");
    expect(pu.amount.value).toBe("1974");
    expect(pu.items[0].unit_amount.value).toBe("1064");
  });

  test("502 when PayPal rejects the order", async () => {
    const { POST } = await load();
    stubFetch(paypalRoutes({ status: 422, json: { details: [{ description: "AMOUNT_MISMATCH" }] } }));
    expect((await POST(jsonRequest(PATH, { items: [{ slug: STICKER, qty: 1 }] }))).status).toBe(502);
  });
});
