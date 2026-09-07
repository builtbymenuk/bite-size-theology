// Self-check for the rate limiter. Run: npx tsx src/lib/rate-limit.check.ts
import assert from "node:assert";
import { allow, clientIp } from "./rate-limit";

const MIN = 60_000;
const t0 = 1_000_000;

// Under the limit passes, the (max+1)th does not.
assert(allow("a", 3, MIN, t0), "1st should pass");
assert(allow("a", 3, MIN, t0 + 1), "2nd should pass");
assert(allow("a", 3, MIN, t0 + 2), "3rd should pass");
assert(!allow("a", 3, MIN, t0 + 3), "4th should be blocked");

// Keys are independent.
assert(allow("b", 3, MIN, t0 + 3), "a different key should be unaffected");

// The window actually expires — the whole point of a sliding window, and the easiest bit to get
// wrong. Blocked attempts above must not have extended it.
assert(allow("a", 3, MIN, t0 + MIN + 1), "should pass once the window has slid past");

// ...and it slides rather than resetting: the hit above still counts.
assert(allow("a", 3, MIN, t0 + MIN + 2), "2nd in the new window should pass");
assert(allow("a", 3, MIN, t0 + MIN + 3), "3rd in the new window should pass");
assert(!allow("a", 3, MIN, t0 + MIN + 4), "4th in the new window should be blocked");

// clientIp takes the leftmost x-forwarded-for entry, falls back, then gives up.
const ip = (h: Record<string, string>) => clientIp(new Request("http://x/", { headers: h }));
assert(ip({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }) === "1.2.3.4", "should take the leftmost xff");
assert(ip({ "x-real-ip": "5.6.7.8" }) === "5.6.7.8", "should fall back to x-real-ip");
assert(ip({}) === "unknown", "should degrade to a shared bucket");

console.log("rate-limit: all checks passed");
