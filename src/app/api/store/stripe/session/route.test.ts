import { beforeEach, describe, expect, test, vi } from "vitest";
import { withEnv } from "../../../../../../test/env";
import { networkError, stubFetch } from "../../../../../../test/fetch-stub";
import { jsonRequest, rawRequest } from "../../../../../../test/request";
import { openShop, shop } from "../../../../../../test/shop";

const stripe = vi.hoisted(() => ({
  stripeConfigured: vi.fn(),
  createCheckoutSession: vi.fn(),
}));
vi.mock("@/lib/stripe", () => stripe);

// No STRAPI_URL → static catalogue.
const load = () =>
  withEnv({}, async () => {
    openShop(); // the fallback store is "coming soon"; see test/shop.ts
    return import("./route");
  });
const PATH = "/api/store/stripe/session";
const HOODIE = "call-on-jesus-vintage-faded-hoodie";
const STICKER = "honk-if-you-love-jesus-bumper-sticker";

beforeEach(() => {
  stripe.stripeConfigured.mockReset().mockReturnValue(true);
  stripe.createCheckoutSession.mockReset().mockResolvedValue({ url: "https://checkout.stripe.test/c" });
});

describe("POST /api/store/stripe/session", () => {
  test("503 when Stripe isn't configured", async () => {
    stripe.stripeConfigured.mockReturnValue(false);
    const { POST } = await load();
    stubFetch({});
    expect((await POST(jsonRequest(PATH, { items: [{ slug: STICKER }] }))).status).toBe(503);
    expect(stripe.createCheckoutSession).not.toHaveBeenCalled();
  });

  test("400 on bad JSON", async () => {
    const { POST } = await load();
    stubFetch({});
    expect((await POST(rawRequest(PATH, "{"))).status).toBe(400);
  });

  test.each([
    ["empty cart", [], 400],
    ["invalid size", [{ slug: HOODIE, size: "XXS" }], 400],
    ["unknown slug", [{ slug: "ghost" }], 409],
    ["sold out", [{ slug: "the-untitled-book" }], 409],
  ])("%s → %s, Stripe never called", async (_l, items, status) => {
    const { POST } = await load();
    stubFetch({});
    expect((await POST(jsonRequest(PATH, { items }))).status).toBe(status);
    expect(stripe.createCheckoutSession).not.toHaveBeenCalled();
  });

  test("Stripe gets the server-repriced lines + shipping in minor units; tampered prices ignored", async () => {
    const { POST } = await load();
    stubFetch({});
    const res = await POST(
      jsonRequest(PATH, {
        items: [
          { slug: HOODIE, size: "S", qty: 2, price: 0.01, unitPrice: 0.01 },
          { slug: STICKER, qty: 1, unitPrice: 0 },
        ],
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.test/c" });
    const opts = stripe.createCheckoutSession.mock.calls[0][0];
    expect(opts).toMatchObject({
      shippingCents: 599,
      currency: "USD",
      decimals: 2,
      origin: "http://localhost:3000",
    });
    expect(opts.lines.map((l: { slug: string; qty: number; unitPrice: number }) => [l.slug, l.qty, l.unitPrice])).toEqual([
      [HOODIE, 2, 45],
      [STICKER, 1, 7],
    ]);
  });

  test("a converted currency passes its precision through (JPY → 0 decimals)", async () => {
    const { POST } = await load();
    stubFetch({ "open.er-api.com": networkError });
    await POST(jsonRequest(PATH, { items: [{ slug: STICKER }], currency: "jpy" }));
    expect(stripe.createCheckoutSession.mock.calls[0][0]).toMatchObject({
      currency: "JPY",
      decimals: 0,
      shippingCents: 910,
      lines: [expect.objectContaining({ unitPrice: 1064 })],
    });
  });

  test("403 while the store is 'coming soon'; Stripe never called", async () => {
    shop.open = false;
    const { POST } = await load();
    stubFetch({});
    const res = await POST(jsonRequest(PATH, { items: [{ slug: STICKER, qty: 1 }] }));
    expect(res.status).toBe(403);
    expect(stripe.createCheckoutSession).not.toHaveBeenCalled();
  });

  test("502 when Stripe throws", async () => {
    stripe.createCheckoutSession.mockRejectedValue(new Error("rate limited"));
    const { POST } = await load();
    stubFetch({});
    expect((await POST(jsonRequest(PATH, { items: [{ slug: STICKER }] }))).status).toBe(502);
  });
});
