// Self-check for newsletter validate(). Run: npx tsx src/lib/newsletter.check.ts
import assert from "node:assert";
import { validate } from "./newsletter";

// valid address passes and defaults to the footer
let r = validate({ email: "jane@example.com" });
assert(r.ok && !r.spam && r.data.source === "footer", "plain address should pass as footer");

// address is normalized — this is what keeps the unique index honest
r = validate({ email: "  Jane@Example.COM  " });
assert(r.ok && r.data.email === "jane@example.com", "email should trim + lowercase");

// source is honoured when known, coerced when not
assert(validate({ email: "a@b.co", source: "popup" }).ok, "popup source should pass");
r = validate({ email: "a@b.co", source: "carrier-pigeon" });
assert(r.ok && r.data.source === "footer", "unknown source should fall back to footer");

// honeypot filled → accepted but flagged spam, and nothing else is checked
r = validate({ email: "", website: "http://bot" });
assert(r.ok && r.spam, "honeypot should flag spam even with a blank email");

// rejections
assert(!validate({}).ok, "missing email should fail");
assert(!validate({ email: "   " }).ok, "blank email should fail");
assert(!validate({ email: "nope" }).ok, "malformed email should fail");
assert(!validate({ email: "a@b.co".padStart(300, "x") }).ok, "over-long email should fail");

console.log("newsletter validate(): all checks passed");
