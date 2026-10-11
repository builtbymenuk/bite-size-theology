import { describe, expect, test } from "vitest";
import { withEnv } from "../../../../../../test/env";
import { networkError, stubFetch } from "../../../../../../test/fetch-stub";
import { paypalRoutes } from "../../../../../../test/fixtures/payments";
import { jsonRequest, rawRequest } from "../../../../../../test/request";

const PAYPAL = { PAYPAL_CLIENT_ID: "client-id", PAYPAL_CLIENT_SECRET: "s3cret" };
const load = (env: Record<string, string> = PAYPAL) => withEnv(env, () => import("./route"));
const PATH = "/api/donate/paypal/create";

describe("POST /api/donate/paypal/create", () => {
  test("503 when PayPal isn't configured", async () => {
    const { POST } = await load({});
    const net = stubFetch({});
    const res = await POST(jsonRequest(PATH, { amount: 10 }));
    expect(res.status).toBe(503);
    expect(net.calls).toHaveLength(0);
  });

  test("400 on a body that isn't JSON", async () => {
    const { POST } = await load();
    const net = stubFetch({});
    expect((await POST(rawRequest(PATH, "{nope"))).status).toBe(400);
    expect(net.calls).toHaveLength(0);
  });

  test.each([[0.5], [50_000.01], ["junk"], [null], [-10]])(
    "400 for amount %j, without calling PayPal",
    async (amount) => {
      const { POST } = await load();
      const net = stubFetch({});
      const res = await POST(jsonRequest(PATH, { amount }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBeTruthy();
      expect(net.calls).toHaveLength(0);
    },
  );

  test("200 {id}; the PayPal order is a single USD line for the validated amount, no shipping", async () => {
    const { POST } = await load();
    const net = stubFetch(paypalRoutes({ status: 201, json: { id: "ORDER-1", status: "CREATED" } }));
    const res = await POST(jsonRequest(PATH, { amount: "$1,234.567" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "ORDER-1" });

    const [create] = net.to("/v2/checkout/orders");
    expect(create.headers.authorization).toBe("Bearer pp-access");
    expect(create.body).toEqual({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "1234.57",
            breakdown: {
              item_total: { currency_code: "USD", value: "1234.57" },
              shipping: { currency_code: "USD", value: "0.00" },
            },
          },
          items: [
            {
              name: "Donation — Bite Size Theology",
              quantity: "1",
              unit_amount: { currency_code: "USD", value: "1234.57" },
            },
          ],
        },
      ],
    });
  });

  test("502 when PayPal rejects the order", async () => {
    const { POST } = await load();
    stubFetch(paypalRoutes({ status: 422, json: { message: "nope" } }));
    const res = await POST(jsonRequest(PATH, { amount: 25 }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("$25.00");
  });

  test("502 when PayPal is unreachable", async () => {
    const { POST } = await load();
    stubFetch({ "paypal.com": networkError });
    expect((await POST(jsonRequest(PATH, { amount: 25 }))).status).toBe(502);
  });
});
