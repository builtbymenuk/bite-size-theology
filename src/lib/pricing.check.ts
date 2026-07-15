// Runnable money-path check — no test framework:
//   node --experimental-strip-types src/lib/pricing.check.ts
import assert from "node:assert/strict";
import { computeTotals, toCents } from "./pricing.ts";

// round each unit to cents first, so float artifacts never reach a total
assert.equal(toCents(19.99), 1999);
assert.equal(toCents(0.1) + toCents(0.2), 30);

// subtotal = Σ unit*qty, plus the flat shipping fee; the breakdown always sums to the total
const t = computeTotals(
  [
    { unitPrice: 45, qty: 2 }, // 90.00
    { unitPrice: 30, qty: 1 }, // 30.00
  ],
  5.99,
);
assert.equal(t.subtotal, "120.00");
assert.equal(t.shipping, "5.99");
assert.equal(t.total, "125.99");
assert.equal(t.subtotalCents + t.shippingCents, t.totalCents);

// float-prone case: 0.1 * 3 === 0.30000000000000004 in float; cents keep it exact
assert.equal(computeTotals([{ unitPrice: 0.1, qty: 3 }], 0).total, "0.30");

// tamper resistance: only `unitPrice` is read — an injected `price` field is ignored
const tampered = computeTotals(
  [{ unitPrice: 30, qty: 1, price: 0.01 } as unknown as { unitPrice: number; qty: number }],
  0,
);
assert.equal(tampered.total, "30.00");

// negative / fractional qty can't create negative or fractional charges
assert.equal(computeTotals([{ unitPrice: 30, qty: -5 }], 0).total, "0.00");
assert.equal(computeTotals([{ unitPrice: 30, qty: 1.9 }], 0).total, "30.00");

console.log("pricing check: OK");
