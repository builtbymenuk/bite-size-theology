// Self-check for donation validateAmount(). Run: npx tsx src/lib/donation.check.ts
import assert from "node:assert";
import { validateAmount, MIN_CENTS, MAX_CENTS } from "./donation";

// valid amounts → cents
let r = validateAmount(50);
assert(r.ok && r.cents === 5000, "$50 → 5000 cents");
r = validateAmount("25.50");
assert(r.ok && r.cents === 2550, "'25.50' → 2550 cents");
r = validateAmount("$100");
assert(r.ok && r.cents === 10000, "'$100' strips symbol → 10000 cents");

// boundaries
assert(validateAmount(1).ok, "min $1 allowed");
assert(!validateAmount(0.5).ok, "below $1 rejected");
assert(validateAmount(MAX_CENTS / 100).ok, "max allowed");
assert(!validateAmount(MAX_CENTS / 100 + 1).ok, "over max rejected");

// junk
for (const bad of [0, -10, "abc", "", null, undefined, NaN]) {
  assert(!validateAmount(bad as unknown).ok, `${String(bad)} rejected`);
}

console.log("donation validateAmount(): all checks passed", { MIN_CENTS, MAX_CENTS });
