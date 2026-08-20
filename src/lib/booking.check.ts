// Self-check for booking validate()/summary(). Run: npx tsx src/lib/booking.check.ts
import assert from "node:assert";
import { validate, summary } from "./booking";

const good = {
  audience: "church",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "555-1234",
  role: "Lead Pastor",
  organization: "Grace Church",
  location: "Dallas, TX",
  eventDate: "2026-03-14",
  message: "We'd love to have Caleb speak.",
};

// valid payload passes, not flagged spam
let r = validate(good);
assert(r.ok && !r.spam, "valid payload should pass");
assert(r.ok && r.data.name === "Jane Doe", "first + last compose into name");
assert(r.ok && r.data.audience === "church", "audience defaults through");

// honeypot filled → accepted but flagged spam (caller drops)
r = validate({ ...good, website: "http://bot" });
assert(r.ok && r.spam, "honeypot should flag spam");

// the real website field must NOT trip the honeypot
r = validate({ ...good, orgWebsite: "https://gracechurch.org" });
assert(r.ok && !r.spam, "orgWebsite is a real field, not the honeypot");

// each shared required field missing → rejected
for (const f of ["email", "phone", "role", "organization", "location", "eventDate", "message"]) {
  assert(!validate({ ...good, [f]: "" }).ok, `missing ${f} should fail`);
}
assert(!validate({ ...good, firstName: "", lastName: "" }).ok, "missing name should fail");

// church leaves eventType/industry optional; corporate requires both
assert(validate({ ...good, eventType: "" }).ok, "church eventType is optional");
const corp = { ...good, audience: "corporate", industry: "Technology", eventType: "Staff retreat" };
assert(validate(corp).ok, "valid corporate payload should pass");
assert(!validate({ ...corp, industry: "" }).ok, "corporate industry is required");
assert(!validate({ ...corp, eventType: "" }).ok, "corporate eventType is required");

// unknown audience falls back to church rather than passing through
r = validate({ ...good, audience: "<script>" });
assert(r.ok && r.data.audience === "church", "unknown audience falls back to church");

// bad email → rejected
assert(!validate({ ...good, email: "nope" }).ok, "bad email should fail");

// over-length → rejected
assert(!validate({ ...good, message: "x".repeat(5001) }).ok, "over-long message should fail");

// summary() lists only answered rows, and picks labels per audience
const full = validate({ ...good, attendance: "250–500", focus: "Discipleship", budget: "$3,000" });
assert(full.ok, "setup");
const out = summary(full.data);
assert(out.includes("Average weekend attendance: 250–500"), "church label used");
assert(out.includes("Event theme: Discipleship"), "church focus label used");
assert(!out.includes("Alternate date"), "blank rows are omitted");
assert(!out.includes("Decision timeline"), "corporate-only rows omitted for church");

const c = validate({ ...corp, orgSize: "500–1,000", focus: "Leadership", timeline: "Within a month" });
assert(c.ok, "setup");
const cout = summary(c.data);
assert(cout.includes("Organization size: 500–1,000"), "corporate label used");
assert(cout.includes("Topic / focus area: Leadership"), "corporate focus label used");
assert(cout.includes("Decision timeline: Within a month"), "corporate timeline included");

console.log("booking validate(): all checks passed");
