// Self-check for validate(). Run: npx tsx src/lib/contact.check.ts
import assert from "node:assert";
import { validate } from "./contact";

const good = { name: "Jane", email: "jane@example.com", subject: "Hi", message: "Hello there" };

// valid payload passes, not flagged spam
let r = validate(good);
assert(r.ok && !r.spam, "valid payload should pass");

// honeypot filled → accepted but flagged spam (caller drops)
r = validate({ ...good, company: "bot inc" });
assert(r.ok && r.spam, "honeypot should flag spam");

// missing required fields → rejected
assert(!validate({ ...good, name: "" }).ok, "missing name should fail");
assert(!validate({ ...good, message: "  " }).ok, "blank message should fail");

// bad email → rejected
assert(!validate({ ...good, email: "not-an-email" }).ok, "bad email should fail");

// over-length → rejected
assert(!validate({ ...good, message: "x".repeat(5001) }).ok, "over-long message should fail");

console.log("contact validate(): all checks passed");
