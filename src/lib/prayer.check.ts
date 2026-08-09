// Self-check for prayer validate(). Run: npx tsx src/lib/prayer.check.ts
import assert from "node:assert";
import { validate } from "./prayer";

const good = { request: "Please pray for my family." };

// valid minimal (anonymous, no name/email) passes
let r = validate(good);
assert(r.ok && !r.spam, "anonymous request should pass");

// urgent coerces from checkbox value
r = validate({ ...good, name: "Jane", email: "jane@example.com", urgent: "on" });
assert(r.ok && r.data.urgent === true, "urgent should coerce");

// honeypot filled → accepted but flagged spam
r = validate({ ...good, website: "http://bot" });
assert(r.ok && r.spam, "honeypot should flag spam");

// blank request → rejected
assert(!validate({ request: "   " }).ok, "blank request should fail");

// bad email (when given) → rejected; blank email is fine
assert(!validate({ ...good, email: "nope" }).ok, "bad email should fail");
assert(validate({ ...good, email: "" }).ok, "blank email should pass");

// over-length request → rejected
assert(!validate({ request: "x".repeat(5001) }).ok, "over-long request should fail");

console.log("prayer validate(): all checks passed");
