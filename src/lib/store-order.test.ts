import { describe, expect, test } from "vitest";
import { CONFIGURED, withEnv } from "../../test/env";
import { networkError, stubFetch } from "../../test/fetch-stub";

// No STRAPI_URL → cms.ts serves the static catalogue in content.ts (shipping 5.99 USD).
const load = (env: Record<string, string> = {}) => withEnv(env, () => import("./store-order"));

const HOODIE = "call-on-jesus-vintage-faded-hoodie"; // $45, sizes S–2XL
const STICKER = "honk-if-you-love-jesus-bumper-sticker"; // $7, one size
const SOLD_OUT = "the-untitled-book";

const RATES = "open.er-api.com";

describe("priceCart — the server is the only source of prices", () => {
  test("ignores every client-supplied price field and charges the catalogue price", async () => {
    const { priceCart } = await load();
    const tampered = [
      { slug: HOODIE, size: "M", qty: 2, price: 0.01, unitPrice: 0.01, total: 0.01, title: "Free" },
    ];
    const r = await priceCart(tampered);
    if (!r.ok) throw new Error(r.error);
    expect(r.lines).toEqual([
      { slug: HOODIE, title: expect.stringContaining("Hooded Sweatshirt"), size: "M", qty: 2, unitPrice: 45, description: "Size: M" },
    ]);
    expect(r.totals).toEqual({
      subtotalCents: 9000,
      shippingCents: 599,
      totalCents: 9599,
      subtotal: "90.00",
      shipping: "5.99",
      total: "95.99",
    });
    expect(r.currency).toBe("USD");
    expect(r.decimals).toBe(2);
  });

  test("400 on an empty cart, a non-array, or a cart of slug-less junk", async () => {
    const { priceCart } = await load();
    for (const raw of [[], undefined, "nope", { slug: HOODIE }, [{}, { slug: "" }, null]]) {
      expect(await priceCart(raw)).toEqual({ ok: false, status: 400, error: "Your cart is empty." });
    }
  });

  test("409 on an unknown slug", async () => {
    const { priceCart } = await load();
    const r = await priceCart([{ slug: "no-such-thing", qty: 1 }]);
    expect(r).toMatchObject({ ok: false, status: 409 });
  });

  test("409 on a sold-out product, even alongside valid items", async () => {
    const { priceCart } = await load();
    const r = await priceCart([{ slug: STICKER, qty: 1 }, { slug: SOLD_OUT, qty: 1 }]);
    expect(r).toMatchObject({ ok: false, status: 409 });
  });

  test("400 when a sized product has no size or an invalid one", async () => {
    const { priceCart } = await load();
    expect(await priceCart([{ slug: HOODIE, qty: 1 }])).toMatchObject({ ok: false, status: 400 });
    expect(await priceCart([{ slug: HOODIE, size: "XXXL", qty: 1 }])).toMatchObject({ ok: false, status: 400 });
    expect(await priceCart([{ slug: HOODIE, size: "m", qty: 1 }])).toMatchObject({ ok: false, status: 400 });
  });

  test("a one-size product needs no size", async () => {
    const { priceCart } = await load();
    const r = await priceCart([{ slug: STICKER, qty: 1 }]);
    expect(r.ok && r.lines[0]).toMatchObject({ size: undefined, description: undefined, unitPrice: 7 });
  });

  test("qty is truncated and clamped to at least 1 (0, -3, junk → 1; 2.7 → 2)", async () => {
    const { priceCart } = await load();
    const qtys = [0, -3, 2.7, "4", "abc", undefined, -0.5];
    const r = await priceCart(qtys.map((qty) => ({ slug: STICKER, qty })));
    if (!r.ok) throw new Error(r.error);
    expect(r.lines.map((l) => l.qty)).toEqual([1, 1, 2, 4, 1, 1, 1]);
    expect(r.totals.subtotalCents).toBe(700 * (1 + 1 + 2 + 4 + 1 + 1 + 1));
  });

  test("no upper bound on qty (oddity: 1,000,000 hoodies prices fine)", async () => {
    const { priceCart } = await load();
    const r = await priceCart([{ slug: HOODIE, size: "L", qty: 1_000_000 }]);
    expect(r.ok && r.totals.subtotalCents).toBe(4_500_000_000);
  });

  test("an unsupported currency silently prices in the base currency (no FX call)", async () => {
    const { priceCart } = await load();
    const net = stubFetch({});
    for (const wanted of ["XYZ", "", 42, { code: "GBP" }, null]) {
      const r = await priceCart([{ slug: HOODIE, size: "M", qty: 1 }], wanted);
      expect(r.ok && [r.currency, r.totals.total]).toEqual(["USD", "50.99"]);
    }
    expect(net.calls).toHaveLength(0);
  });

  test("a supported currency converts each line + shipping on its own, in integer minor units", async () => {
    const { priceCart } = await load();
    const net = stubFetch({ [RATES]: { json: { rates: { GBP: 0.7777 } } } });
    const r = await priceCart(
      [
        { slug: HOODIE, size: "M", qty: 2 },
        { slug: STICKER, qty: 3 },
      ],
      "gbp",
    );
    if (!r.ok) throw new Error(r.error);
    expect(net.to(RATES)).toHaveLength(1);
    expect(r.currency).toBe("GBP");
    expect(r.decimals).toBe(2);
    // 45 × 0.7777 = 34.9965 → 35.00; 7 × 0.7777 = 5.4439 → 5.44; 5.99 × 0.7777 = 4.658 → 4.66
    expect(r.lines.map((l) => l.unitPrice)).toEqual([35, 5.44]);
    expect(r.totals).toMatchObject({
      subtotalCents: 3500 * 2 + 544 * 3,
      shippingCents: 466,
      totalCents: 3500 * 2 + 544 * 3 + 466,
      total: "90.98",
    });
    for (const k of ["subtotalCents", "shippingCents", "totalCents"] as const) {
      expect(Number.isInteger(r.totals[k])).toBe(true);
    }
    // PayPal's invariant: Σ(unit × qty) === item_total
    const sum = r.lines.reduce((s, l) => s + Math.round(l.unitPrice * 100) * l.qty, 0);
    expect(sum).toBe(r.totals.subtotalCents);
  });

  test("an FX outage falls back to FALLBACK_RATES (JPY is zero-decimal)", async () => {
    const { priceCart } = await load();
    const { FALLBACK_RATES } = await import("./currency");
    stubFetch({ [RATES]: networkError });
    const r = await priceCart([{ slug: HOODIE, size: "M", qty: 1 }], "JPY");
    if (!r.ok) throw new Error(r.error);
    expect(FALLBACK_RATES.JPY).toBe(152);
    expect(r).toMatchObject({ currency: "JPY", decimals: 0 });
    // 45 × 152 = 6840; 5.99 × 152 = 910.48 → 910
    expect(r.totals).toMatchObject({ subtotalCents: 6840, shippingCents: 910, totalCents: 7750, total: "7750" });
  });

  test("a non-OK rates response also falls back", async () => {
    const { priceCart } = await load();
    stubFetch({ [RATES]: { status: 500, json: {} } });
    const r = await priceCart([{ slug: STICKER, qty: 1 }], "EUR");
    expect(r.ok && r.lines[0].unitPrice).toBe(6.44); // 7 × 0.92
  });

  test.todo(
    "BUG: priceCart does not enforce store.comingSoon — checkout works while the store is 'coming soon'",
  );

  test("documents the coming-soon gap: the fallback store is comingSoon yet a cart still prices", async () => {
    const { priceCart } = await load();
    const r = await priceCart([{ slug: STICKER, qty: 1 }]);
    expect(r.ok && r.store.comingSoon).toBe(true);
  });
});

describe("priceCart with Strapi configured", () => {
  const strapiProduct = {
    slug: "strapi-hoodie",
    title: "Strapi Hoodie",
    price: "50",
    sizes: [{ value: "M" }, { value: "L" }],
    soldOut: false,
  };

  test("product + store data come from Strapi (price, sizes, shipping), with the token", async () => {
    const { priceCart } = await load(CONFIGURED);
    const net = stubFetch({
      "strapi.test/api/store": { json: { data: { shippingFee: 10, currency: "USD", comingSoon: false } } },
      "strapi.test/api/products": { json: { data: [strapiProduct] } },
    });
    const r = await priceCart([{ slug: "strapi-hoodie", size: "L", qty: 2, price: 1 }]);
    if (!r.ok) throw new Error(r.error);
    expect(r.lines[0]).toMatchObject({ title: "Strapi Hoodie", unitPrice: 50, size: "L" });
    expect(r.totals).toMatchObject({ subtotalCents: 10000, shippingCents: 1000, total: "110.00" });

    const [lookup] = net.to("/api/products");
    expect(lookup.url).toContain("filters[slug][$eq]=strapi-hoodie");
    expect(lookup.headers.authorization).toBe("Bearer test-token");
  });

  test("a Strapi soldOut flag → 409", async () => {
    const { priceCart } = await load(CONFIGURED);
    stubFetch({
      "strapi.test/api/store": { json: { data: null } },
      "strapi.test/api/products": { json: { data: [{ ...strapiProduct, soldOut: true }] } },
    });
    expect(await priceCart([{ slug: "strapi-hoodie", size: "M" }])).toMatchObject({ ok: false, status: 409 });
  });

  test("Strapi 500 → static catalogue + static shipping", async () => {
    const { priceCart } = await load(CONFIGURED);
    stubFetch({ "strapi.test": { status: 500, json: {} } });
    const r = await priceCart([{ slug: HOODIE, size: "S", qty: 1 }]);
    expect(r.ok && r.totals.total).toBe("50.99");
  });

  test("Strapi down (network error) → static catalogue too", async () => {
    const { priceCart } = await load(CONFIGURED);
    stubFetch({ "strapi.test": networkError });
    const r = await priceCart([{ slug: STICKER, qty: 1 }]);
    expect(r.ok && r.totals.total).toBe("12.99");
  });

  test("oddity: a slug Strapi doesn't have still sells at the STATIC price if content.ts lists it", async () => {
    const { priceCart } = await load(CONFIGURED);
    stubFetch({
      "strapi.test/api/store": { json: { data: null } },
      "strapi.test/api/products": { json: { data: [] } }, // e.g. product deleted / unpublished in Strapi
    });
    const r = await priceCart([{ slug: STICKER, qty: 1 }]);
    expect(r.ok && r.lines[0].unitPrice).toBe(7);
  });
});

describe("snapshotItems", () => {
  test("rebuilds title/price from the catalogue by slug; unknown slugs keep the slug as title", async () => {
    const { snapshotItems } = await load();
    const out = await snapshotItems([
      { slug: HOODIE, size: "M", qty: 2.9 },
      { slug: "mystery", qty: 0 },
      {},
    ]);
    expect(out).toEqual([
      { slug: HOODIE, title: expect.stringContaining("Hooded Sweatshirt"), size: "M", qty: 2, unitPrice: 45 },
      { slug: "mystery", title: "mystery", size: null, qty: 1, unitPrice: null },
    ]);
  });
});

describe("orderExists", () => {
  test("null without a token, and never calls Strapi", async () => {
    const { orderExists } = await load({ STRAPI_URL: "http://strapi.test" });
    const net = stubFetch({});
    expect(await orderExists("paypal", "X")).toBeNull();
    expect(net.calls).toHaveLength(0);
  });

  test("null for an empty ref", async () => {
    const { orderExists } = await load(CONFIGURED);
    const net = stubFetch({});
    expect(await orderExists("stripe", "")).toBeNull();
    expect(net.calls).toHaveLength(0);
  });

  test("filters by the provider's field, URL-encodes the ref, returns the first row", async () => {
    const { orderExists } = await load(CONFIGURED);
    const net = stubFetch({
      "strapi.test/api/orders": { json: { data: [{ orderNumber: "BST-1" }, { orderNumber: "BST-2" }] } },
    });
    expect(await orderExists("paypal", "a b&c=d")).toEqual({ orderNumber: "BST-1" });
    expect(await orderExists("stripe", "cs_1")).toEqual({ orderNumber: "BST-1" });
    expect(net.calls[0].url).toBe(
      "http://strapi.test/api/orders?filters[paypalOrderId][$eq]=a%20b%26c%3Dd",
    );
    expect(net.calls[0].headers.authorization).toBe("Bearer test-token");
    expect(net.calls[1].url).toContain("filters[stripeSessionId][$eq]=cs_1");
  });

  test("null when no rows, on non-OK, and on a network error", async () => {
    const { orderExists } = await load(CONFIGURED);
    stubFetch({ "strapi.test/api/orders": { json: { data: [] } } });
    expect(await orderExists("paypal", "X")).toBeNull();
    stubFetch({ "strapi.test/api/orders": { status: 403, json: { data: [{ orderNumber: "no" }] } } });
    expect(await orderExists("paypal", "X")).toBeNull();
    stubFetch({ "strapi.test/api/orders": networkError });
    expect(await orderExists("paypal", "X")).toBeNull();
  });
});

describe("saveOrder", () => {
  const order = {
    orderNumber: "BST-ABCDEFGH",
    email: "a@b.c",
    payerName: "Ada",
    provider: "paypal" as const,
    subtotal: 90,
    shipping: 5.99,
    total: 95.99,
    currency: "USD",
    paypalOrderId: "PO1",
    paypalCaptureId: "CAP1",
    shippingAddress: { name: "Ada", country_code: "US" },
  };

  test("skips (false) without a token", async () => {
    const { saveOrder } = await load();
    const net = stubFetch({});
    expect(await saveOrder(order, [])).toBe(false);
    expect(net.calls).toHaveLength(0);
  });

  test("POSTs the full record with Bearer auth and orderStatus 'paid'", async () => {
    const { saveOrder } = await load(CONFIGURED);
    const net = stubFetch({ "strapi.test/api/orders": { status: 201, json: { data: {} } } });
    const items = [{ slug: "x", qty: 1 }];
    expect(await saveOrder(order, items)).toBe(true);
    const [call] = net.calls;
    expect(call.method).toBe("POST");
    expect(call.headers.authorization).toBe("Bearer test-token");
    expect(call.headers["content-type"]).toBe("application/json");
    expect(call.body).toEqual({
      data: {
        orderNumber: "BST-ABCDEFGH",
        email: "a@b.c",
        payerName: "Ada",
        items,
        subtotal: 90,
        shipping: 5.99,
        total: 95.99,
        currency: "USD",
        orderStatus: "paid",
        provider: "paypal",
        paypalOrderId: "PO1",
        paypalCaptureId: "CAP1",
        shippingAddress: { name: "Ada", country_code: "US" },
      },
    });
  });

  test("throws on a non-OK Strapi response (callers must catch)", async () => {
    const { saveOrder } = await load(CONFIGURED);
    stubFetch({ "strapi.test/api/orders": { status: 400, json: {} } });
    await expect(saveOrder(order, [])).rejects.toThrow("(400)");
  });
});
