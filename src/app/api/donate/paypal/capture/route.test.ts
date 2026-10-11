import { describe, expect, test } from "vitest";
import { CONFIGURED, withEnv } from "../../../../../../test/env";
import { networkError, stubFetch } from "../../../../../../test/fetch-stub";
import {
  paypalCaptureCompleted,
  paypalCapturePending,
  paypalRoutes,
} from "../../../../../../test/fixtures/payments";
import { jsonRequest, rawRequest } from "../../../../../../test/request";

const ENV = { ...CONFIGURED, PAYPAL_CLIENT_ID: "client-id", PAYPAL_CLIENT_SECRET: "s3cret" };
const load = (env: Record<string, string> = ENV) => withEnv(env, () => import("./route"));
const PATH = "/api/donate/paypal/capture";

const services = (capture: unknown, overrides = {}) =>
  stubFetch({
    ...paypalRoutes({ status: 201, json: capture }),
    "strapi.test/api/donations?": { json: { data: [] } }, // donationExists lookup
    "strapi.test/api/donations": { status: 201, json: { data: {} } }, // saveDonation
    ...overrides,
  });

describe("POST /api/donate/paypal/capture", () => {
  test("503 when PayPal isn't configured", async () => {
    const { POST } = await load({ ...CONFIGURED });
    const net = stubFetch({});
    expect((await POST(jsonRequest(PATH, { orderID: "X" }))).status).toBe(503);
    expect(net.calls).toHaveLength(0);
  });

  test("400 on bad JSON or a missing orderID", async () => {
    const { POST } = await load();
    const net = stubFetch({});
    expect((await POST(rawRequest(PATH, "{"))).status).toBe(400);
    expect((await POST(jsonRequest(PATH, { meta: {} }))).status).toBe(400);
    expect(net.calls).toHaveLength(0);
  });

  test("502 when the PayPal capture fails; nothing is saved", async () => {
    const { POST } = await load();
    const net = services({}, paypalRoutes({ status: 422, json: { message: "ORDER_NOT_APPROVED" } }));
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123" }))).status).toBe(502);
    expect(net.to("strapi.test")).toHaveLength(0);
  });

  test("402 when the capture isn't COMPLETED; nothing is saved", async () => {
    const { POST } = await load();
    const net = services(paypalCapturePending());
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123" }));
    expect(res.status).toBe(402);
    expect((await res.json()).status).toBe("PENDING");
    expect(net.to("strapi.test")).toHaveLength(0);
  });

  test("200 with PayPal's captured amount — a client-sent amount is ignored", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted("77.70", "USD"));
    const res = await POST(
      jsonRequest(PATH, {
        orderID: "PAYORDER123",
        amount: 1,
        meta: { name: "Donor", email: "d@x.org", fund: "Missions", message: "Hi", amount: 1 },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, amount: 77.7, currency: "USD" });

    const [capture] = net.to("/v2/checkout/orders/");
    expect(capture.url).toContain("/v2/checkout/orders/PAYORDER123/capture");

    const save = net.calls.find((c) => c.method === "POST" && c.url.endsWith("/api/donations"))!;
    expect(save.headers.authorization).toBe("Bearer test-token");
    expect(save.body).toEqual({
      data: {
        amount: 77.7,
        currency: "USD",
        name: "Donor",
        email: "d@x.org",
        fund: "Missions",
        message: "Hi",
        anonymous: false,
        provider: "paypal",
        donationStatus: "completed",
        paypalOrderId: "PAYORDER123",
        paypalCaptureId: "3XY45678abcdefgh",
      },
    });
  });

  test("falls back to the PayPal payer's name/email when meta is empty", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted());
    await POST(jsonRequest(PATH, { orderID: "PAYORDER123" }));
    const save = net.calls.find((c) => c.method === "POST" && c.url.endsWith("/api/donations"))!;
    expect(save.body).toMatchObject({ data: { name: "Ada Lovelace", email: "payer@example.com" } });
  });

  test("idempotent: an existing donation for this PayPal order means no second write", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted(), {
      "strapi.test/api/donations?": { json: { data: [{ documentId: "already" }] } },
    });
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123" }));
    expect(res.status).toBe(200);
    const lookup = net.to("strapi.test/api/donations?");
    expect(lookup).toHaveLength(1);
    expect(lookup[0].url).toContain("filters[paypalOrderId][$eq]=PAYORDER123");
    expect(net.calls.filter((c) => c.method === "POST" && c.url.includes("strapi.test"))).toHaveLength(0);
  });

  test("a Strapi save failure still returns 200 (the money already moved)", async () => {
    const { POST } = await load();
    services(paypalCaptureCompleted("10.00"), {
      "strapi.test/api/donations": { status: 500, json: {} },
    });
    const res = await POST(jsonRequest(PATH, { orderID: "PAYORDER123" }));
    expect(res.status).toBe(200);
    expect((await res.json()).amount).toBe(10);
  });

  test("Strapi unreachable still returns 200", async () => {
    const { POST } = await load();
    services(paypalCaptureCompleted(), { "strapi.test": networkError });
    expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123" }))).status).toBe(200);
  });

  // The client sends donor details alongside the order id; nothing about them is trusted.
  test("donor details are cleaned before saving: capped, trimmed, a bad email dropped", async () => {
    const { POST } = await load();
    const net = services(paypalCaptureCompleted());
    const res = await POST(
      jsonRequest(PATH, {
        orderID: "PAYORDER123",
        meta: {
          name: `  ${"n".repeat(300)}  `,
          email: "not-an-email",
          fund: "f".repeat(300),
          message: "x".repeat(10_000),
          anonymous: "yes", // only true / "true" count
        },
      }),
    );
    expect(res.status).toBe(200); // the gift still goes through: the money already moved
    const save = net.calls.find((c) => c.method === "POST" && c.url.endsWith("/api/donations"))!;
    const data = (save.body as { data: Record<string, unknown> }).data;
    expect(data.name).toBe("n".repeat(100));
    expect(data.fund).toBe("f".repeat(100));
    expect(data.message).toBe("x".repeat(500));
    expect(data.anonymous).toBe(false);
    // An invalid email is dropped, so the payer's PayPal email is used instead.
    expect(data.email).toBe("payer@example.com");
  });

  test("a non-object meta is ignored rather than crashing", async () => {
    const { POST } = await load();
    services(paypalCaptureCompleted());
    for (const meta of ["junk", 42, null, ["a"]]) {
      expect((await POST(jsonRequest(PATH, { orderID: "PAYORDER123", meta }))).status).toBe(200);
    }
  });
});
