import { describe, expect, test } from "vitest";
import { CONFIGURED, withEnv } from "../../test/env";
import { networkError, stubFetch } from "../../test/fetch-stub";
import { MAX_CENTS, MIN_CENTS, validateAmount } from "./donation";

const load = (env: Record<string, string> = {}) => withEnv(env, () => import("./donation"));

describe("validateAmount (the donation trust boundary)", () => {
  test.each([
    [50, 5000],
    ["25.50", 2550],
    ["$1,000.50", 100050],
    [" $ 20 ", 2000],
    [1, MIN_CENTS],
    [50_000, MAX_CENTS],
    [50_000.004, MAX_CENTS], // rounds down to exactly the max
    [0.999, 100], // rounds to the nearest cent (the code comment says "floors" — it doesn't)
    [1.005, 100], // float: 1.005 * 100 = 100.4999…
  ])("%j → %i cents", (raw, cents) => {
    expect(validateAmount(raw)).toEqual({ ok: true, cents });
  });

  test.each([
    [0, "Please enter"],
    [-5, "Please enter"],
    [NaN, "Please enter"],
    [Infinity, "Please enter"],
    [-Infinity, "Please enter"],
    ["Infinity", "Please enter"], // stripped to "" → 0
    ["abc", "Please enter"],
    ["", "Please enter"],
    ["1.2.3", "Please enter"],
    [null, "Please enter"],
    [undefined, "Please enter"],
    [{}, "Please enter"],
    [0.994, "Minimum donation is $1."],
    [0.5, "Minimum donation is $1."],
    [50_000.01, "Please contact us"],
    ["50,000.01", "Please contact us"],
    [1e9, "Please contact us"],
  ])("%j is rejected", (raw, msg) => {
    const r = validateAmount(raw);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain(msg);
  });

  // Oddities of stripping every non-[0-9.] character from strings (src/lib/donation.ts:18).
  test("oddity: a negative STRING loses its sign and is accepted ('-5' → $5)", () => {
    expect(validateAmount("-5")).toEqual({ ok: true, cents: 500 });
  });
  test("oddity: exponent notation in a string is mangled ('1e3' → $13, not $1000)", () => {
    expect(validateAmount("1e3")).toEqual({ ok: true, cents: 1300 });
  });
  test("oddity: boolean true is coerced to $1", () => {
    expect(validateAmount(true)).toEqual({ ok: true, cents: 100 });
  });
});

const record = {
  amount: 25,
  currency: "USD",
  name: "Ada",
  email: "ada@example.com",
  fund: "General",
  message: "Bless",
  provider: "paypal" as const,
  paypalOrderId: "PO1",
  paypalCaptureId: "CAP1",
};

describe("saveDonation", () => {
  test("skips (false) without a token", async () => {
    const { saveDonation } = await load({ STRAPI_URL: "http://strapi.test" });
    const net = stubFetch({});
    expect(await saveDonation(record)).toBe(false);
    expect(net.calls).toHaveLength(0);
  });

  test("POSTs the record with Bearer auth and donationStatus 'completed'", async () => {
    const { saveDonation } = await load(CONFIGURED);
    const net = stubFetch({ "strapi.test/api/donations": { status: 201, json: {} } });
    expect(await saveDonation(record)).toBe(true);
    const [call] = net.calls;
    expect(call.url).toBe("http://strapi.test/api/donations");
    expect(call.method).toBe("POST");
    expect(call.headers.authorization).toBe("Bearer test-token");
    expect(call.body).toEqual({
      data: {
        amount: 25,
        currency: "USD",
        name: "Ada",
        email: "ada@example.com",
        fund: "General",
        message: "Bless",
        anonymous: false,
        provider: "paypal",
        donationStatus: "completed",
        paypalOrderId: "PO1",
        paypalCaptureId: "CAP1",
      },
    });
  });

  test("anonymous drops the name (but keeps the email); blanks are omitted", async () => {
    const { saveDonation } = await load(CONFIGURED);
    const net = stubFetch({ "strapi.test/api/donations": { json: {} } });
    await saveDonation({ ...record, anonymous: true, fund: "", message: "" });
    const data = (net.calls[0].body as { data: Record<string, unknown> }).data;
    expect(data.anonymous).toBe(true);
    expect(data).not.toHaveProperty("name");
    expect(data).not.toHaveProperty("fund");
    expect(data).not.toHaveProperty("message");
    expect(data.email).toBe("ada@example.com");
  });

  test("throws on a non-OK response", async () => {
    const { saveDonation } = await load(CONFIGURED);
    stubFetch({ "strapi.test/api/donations": { status: 500, json: {} } });
    await expect(saveDonation(record)).rejects.toThrow("(500)");
  });
});

describe("donationExists", () => {
  test("null without a token or ref (no call)", async () => {
    const net = stubFetch({});
    const a = await load({ STRAPI_URL: "http://strapi.test" });
    expect(await a.donationExists("paypal", "X")).toBeNull();
    const b = await load(CONFIGURED);
    expect(await b.donationExists("paypal", "")).toBeNull();
    expect(net.calls).toHaveLength(0);
  });

  test("filters by provider field with an encoded ref and returns the first row", async () => {
    const { donationExists } = await load(CONFIGURED);
    const net = stubFetch({
      "strapi.test/api/donations": { json: { data: [{ documentId: "d1" }, { documentId: "d2" }] } },
    });
    expect(await donationExists("stripe", "cs/1 2")).toEqual({ documentId: "d1" });
    expect(await donationExists("paypal", "PO1")).toEqual({ documentId: "d1" });
    expect(net.calls[0].url).toBe(
      "http://strapi.test/api/donations?filters[stripeSessionId][$eq]=cs%2F1%202",
    );
    expect(net.calls[0].headers.authorization).toBe("Bearer test-token");
    expect(net.calls[1].url).toContain("filters[paypalOrderId][$eq]=PO1");
  });

  test("null on empty data, non-OK, and network error", async () => {
    const { donationExists } = await load(CONFIGURED);
    stubFetch({ "strapi.test/api/donations": { json: { data: [] } } });
    expect(await donationExists("paypal", "X")).toBeNull();
    stubFetch({ "strapi.test/api/donations": { status: 500, json: { data: [{ documentId: "x" }] } } });
    expect(await donationExists("paypal", "X")).toBeNull();
    stubFetch({ "strapi.test/api/donations": networkError });
    expect(await donationExists("paypal", "X")).toBeNull();
  });
});
