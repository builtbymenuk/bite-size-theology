import { describe, expect, test } from "vitest";
import { withEnv } from "../../test/env";
import { stubFetch } from "../../test/fetch-stub";
import { PAYPAL_SANDBOX } from "../../test/fixtures/payments";

const CREDS = { PAYPAL_CLIENT_ID: "client-id", PAYPAL_CLIENT_SECRET: "s3cret" };
const load = (env: Record<string, string> = CREDS) => withEnv(env, () => import("./paypal"));

describe("paypalConfigured", () => {
  test("needs a client id AND the secret", async () => {
    // withEnv stubs accumulate within a test, so each case sets both vars explicitly.
    const none = { PAYPAL_CLIENT_ID: "", NEXT_PUBLIC_PAYPAL_CLIENT_ID: "", PAYPAL_CLIENT_SECRET: "" };
    expect((await load(none)).paypalConfigured()).toBe(false);
    expect((await load({ ...none, PAYPAL_CLIENT_ID: "id" })).paypalConfigured()).toBe(false);
    expect((await load({ ...none, PAYPAL_CLIENT_SECRET: "s" })).paypalConfigured()).toBe(false);
    expect((await load(CREDS)).paypalConfigured()).toBe(true);
  });

  test("accepts the public NEXT_PUBLIC_PAYPAL_CLIENT_ID as the id", async () => {
    const m = await load({ NEXT_PUBLIC_PAYPAL_CLIENT_ID: "pub", PAYPAL_CLIENT_SECRET: "s" });
    expect(m.paypalConfigured()).toBe(true);
  });
});

describe("buildCreateOrderBody", () => {
  test("CAPTURE intent with a total = item_total + shipping breakdown and stringified quantities", async () => {
    const { buildCreateOrderBody } = await load();
    const body = buildCreateOrderBody({
      currency: "GBP",
      items: [
        { name: "Hoodie", quantity: 2, unitValue: "35.00", description: "Size: M" },
        { name: "Sticker", quantity: 1, unitValue: "5.44" },
      ],
      itemTotal: "75.44",
      shipping: "4.66",
      total: "80.10",
    });
    expect(body).toEqual({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "GBP",
            value: "80.10",
            breakdown: {
              item_total: { currency_code: "GBP", value: "75.44" },
              shipping: { currency_code: "GBP", value: "4.66" },
            },
          },
          items: [
            { name: "Hoodie", quantity: "2", unit_amount: { currency_code: "GBP", value: "35.00" }, description: "Size: M" },
            { name: "Sticker", quantity: "1", unit_amount: { currency_code: "GBP", value: "5.44" } },
          ],
        },
      ],
    });
  });

  test("truncates item name and description to PayPal's 127-char limit", async () => {
    const { buildCreateOrderBody } = await load();
    const long = "x".repeat(200);
    const body = buildCreateOrderBody({
      currency: "USD",
      items: [{ name: long, quantity: 1, unitValue: "1.00", description: long }],
      itemTotal: "1.00",
      shipping: "0.00",
      total: "1.00",
    });
    const [item] = body.purchase_units[0].items;
    expect(item.name).toHaveLength(127);
    expect(item.description).toHaveLength(127);
  });
});

describe("PayPal REST calls", () => {
  test("token uses HTTP Basic of clientId:secret, then Bearer on the API call (sandbox by default)", async () => {
    const { createOrder } = await load();
    const net = stubFetch({
      [`${PAYPAL_SANDBOX}/v1/oauth2/token`]: { json: { access_token: "tok-1" } },
      [`${PAYPAL_SANDBOX}/v2/checkout/orders`]: { status: 201, json: { id: "O1", status: "CREATED" } },
    });
    expect(await createOrder({ intent: "CAPTURE" })).toEqual({ id: "O1", status: "CREATED" });

    const [auth, create] = net.calls;
    expect(auth.url).toBe("https://api-m.sandbox.paypal.com/v1/oauth2/token");
    expect(auth.method).toBe("POST");
    expect(auth.headers.authorization).toBe(`Basic ${Buffer.from("client-id:s3cret").toString("base64")}`);
    expect(auth.body).toBe("grant_type=client_credentials");
    expect(create.url).toBe("https://api-m.sandbox.paypal.com/v2/checkout/orders");
    expect(create.headers.authorization).toBe("Bearer tok-1");
    expect(create.body).toEqual({ intent: "CAPTURE" });
  });

  test("PAYPAL_ENV=live switches to the live host", async () => {
    const { createOrder } = await load({ ...CREDS, PAYPAL_ENV: "live" });
    const net = stubFetch({
      "api-m.paypal.com/v1/oauth2/token": { json: { access_token: "t" } },
      "api-m.paypal.com/v2/checkout/orders": { json: { id: "O" } },
    });
    await createOrder({});
    expect(net.calls.map((c) => new URL(c.url).host)).toEqual(["api-m.paypal.com", "api-m.paypal.com"]);
  });

  test("captureOrder URL-encodes the order id", async () => {
    const { captureOrder } = await load();
    const net = stubFetch({
      [`${PAYPAL_SANDBOX}/v1/oauth2/token`]: { json: { access_token: "t" } },
      [`${PAYPAL_SANDBOX}/v2/checkout/orders`]: { json: { id: "O", status: "COMPLETED" } },
    });
    await captureOrder("a/../b");
    expect(net.calls[1].url).toBe("https://api-m.sandbox.paypal.com/v2/checkout/orders/a%2F..%2Fb/capture");
  });

  test("a non-OK API response throws with PayPal's detail description", async () => {
    const { createOrder } = await load();
    stubFetch({
      [`${PAYPAL_SANDBOX}/v1/oauth2/token`]: { json: { access_token: "t" } },
      [`${PAYPAL_SANDBOX}/v2/checkout/orders`]: {
        status: 422,
        json: { message: "Unprocessable", details: [{ description: "Item total mismatch" }] },
      },
    });
    await expect(createOrder({})).rejects.toThrow(
      "PayPal /v2/checkout/orders failed (422): Item total mismatch",
    );
  });

  test("falls back to PayPal's top-level message, then the status text", async () => {
    const { createOrder } = await load();
    stubFetch({
      [`${PAYPAL_SANDBOX}/v1/oauth2/token`]: { json: { access_token: "t" } },
      [`${PAYPAL_SANDBOX}/v2/checkout/orders`]: { status: 400, json: { message: "Bad thing" } },
    });
    await expect(createOrder({})).rejects.toThrow("(400): Bad thing");

    stubFetch({
      [`${PAYPAL_SANDBOX}/v1/oauth2/token`]: { json: { access_token: "t" } },
      [`${PAYPAL_SANDBOX}/v2/checkout/orders`]: new Response("<html>", { status: 503, statusText: "Down" }),
    });
    await expect(createOrder({})).rejects.toThrow("(503): Down");
  });

  test("a failed token call throws before any order call", async () => {
    const { createOrder } = await load();
    const net = stubFetch({ [`${PAYPAL_SANDBOX}/v1/oauth2/token`]: { status: 401, json: {} } });
    await expect(createOrder({})).rejects.toThrow("PayPal auth failed (401)");
    expect(net.calls).toHaveLength(1);
  });

  test("unconfigured: throws without touching the network", async () => {
    const { createOrder } = await load({});
    const net = stubFetch({});
    await expect(createOrder({})).rejects.toThrow("PayPal not configured");
    expect(net.calls).toHaveLength(0);
  });
});
