// Self-check for booking validate(). Run: npx tsx src/lib/booking.check.ts
import assert from "node:assert";
import { validate } from "./booking";

const good = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "555-1234",
  organization: "Grace Church",
  eventType: "Conference",
  eventDate: "March 2026",
  location: "Dallas, TX",
  audienceSize: "300",
  message: "We'd love to have Caleb speak.",
};

// valid payload passes, not flagged spam
let r = validate(good);
assert(r.ok && !r.spam, "valid payload should pass");

// honeypot filled → accepted but flagged spam (caller drops)
r = validate({ ...good, website: "http://bot" });
assert(r.ok && r.spam, "honeypot should flag spam");

// each required field missing → rejected
for (const f of ["name", "email", "organization", "eventType", "eventDate", "location", "message"]) {
  assert(!validate({ ...good, [f]: "" }).ok, `missing ${f} should fail`);
}

// optional fields blank → still passes
assert(validate({ ...good, phone: "", audienceSize: "" }).ok, "optional fields may be blank");

// bad email → rejected
assert(!validate({ ...good, email: "nope" }).ok, "bad email should fail");

// over-length → rejected
assert(!validate({ ...good, message: "x".repeat(5001) }).ok, "over-long message should fail");

console.log("booking validate(): all checks passed");
