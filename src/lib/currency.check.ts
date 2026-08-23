// Runnable currency-conversion check — no test framework:
//   node --experimental-strip-types src/lib/currency.check.ts
import assert from "node:assert/strict";
import { CURRENCIES, FALLBACK_RATES, PAYPAL_CURRENCIES, convert, decimalsFor, isSupported } from "./currency.ts";
import { computeTotals } from "./pricing.ts";

// every offered currency has a backstop rate, so a dead FX endpoint can never drop one
for (const c of CURRENCIES) assert.ok(FALLBACK_RATES[c.code] > 0, `no rate for ${c.code}`);
// ...and PayPal's subset can't name a currency we don't offer
for (const code of PAYPAL_CURRENCIES) {
  assert.ok(CURRENCIES.some((c) => c.code === code), `PayPal-only code ${code}`);
}

// the whitelist is what stops a client-supplied currency from reaching Stripe
assert.equal(isSupported("gbp"), true);
assert.equal(isSupported("XYZ"), false);
assert.equal(isSupported(""), false);
assert.equal(isSupported(null), false);
assert.equal(isSupported({ code: "USD" }), false);

// zero-decimal currencies round to whole units; everything else to cents
assert.equal(decimalsFor("JPY"), 0);
assert.equal(decimalsFor("usd"), 2);
assert.equal(convert(38, 152.3, "JPY"), 5787); // ¥5,787 — no fractional yen
assert.equal(convert(38, 0.78, "GBP"), 29.64);
assert.equal(convert(38, 1, "USD"), 38);

// PayPal requires Σ(unit × qty) === item_total. Converting each unit BEFORE totalling keeps that
// true; converting the total instead would drift by a cent per line.
const rate = 0.7813;
const lines = [
  { unitPrice: convert(38, rate, "GBP"), qty: 3 },
  { unitPrice: convert(19.99, rate, "GBP"), qty: 2 },
];
const t = computeTotals(lines, convert(5.99, rate, "GBP"));
const sum = lines.reduce((n, l) => n + Math.round(l.unitPrice * 100) * l.qty, 0);
assert.equal(t.subtotalCents, sum);
assert.equal(t.subtotalCents + t.shippingCents, t.totalCents);

// JPY end to end: whole-unit amounts, and no decimal point in the PayPal "value" strings
const jpy = computeTotals([{ unitPrice: convert(38, 152, "JPY"), qty: 2 }], convert(5.99, 152, "JPY"), 0);
assert.equal(jpy.subtotal, "11552");
assert.equal(jpy.shipping, "910");
assert.equal(jpy.total, "12462");
assert.equal(jpy.totalCents, 12462); // smallest unit === whole yen, not ×100

console.log("currency check: OK");
