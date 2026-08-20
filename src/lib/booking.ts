// Pure, dependency-free validation for the Book Caleb form, split out from the route so it can be
// unit-checked without pulling in next/server or the CMS chain (see booking.check.ts).
//
// The form has two audiences with different field sets (church vs corporate), so `audience` is the
// discriminator and the required-field list branches on it. Everything both tabs share maps onto
// the columns the Booking Request collection already had; the audience-specific extras are folded
// into one `details` block by summary() below, which keeps ~12 columns off the Strapi admin screen
// while still putting every answer in front of whoever reads the request.
import { EMAIL_RE } from "./contact";

export type Audience = "church" | "corporate";

export interface BookingPayload {
  audience: Audience;
  // Core — these land in the Booking Request columns.
  name: string; // first + last, composed here
  email: string;
  phone: string;
  organization: string;
  eventType: string;
  eventDate: string;
  location: string;
  audienceSize: string;
  message: string;
  role: string;
  orgWebsite: string; // NOT `website` — that name is the honeypot below
  // Extras — formatted into `details`.
  altDate: string;
  attendance: string; // church: average weekend attendance
  industry: string; // corporate
  orgSize: string; // corporate
  focus: string; // church: event theme · corporate: topic / focus area
  budget: string; // church: honorarium · corporate: speaking fee budget
  travelCovered: string;
  heardAbout: string;
  timeline: string; // corporate
  extra: string;
  website?: string; // honeypot
}

export type Validated =
  | { ok: true; data: BookingPayload; spam: boolean }
  | { ok: false; error: string };

const s = (v: unknown) => String(v ?? "").trim();

// Asked on both tabs; the labels differ per audience but the answers always arrive.
const REQUIRED_BOTH = [
  "name",
  "email",
  "phone",
  "role",
  "organization",
  "location",
  "eventDate",
  "message",
] as const;

// Trust-boundary validation for POST /api/book.
export function validate(raw: unknown): Validated {
  const b = (raw ?? {}) as Record<string, unknown>;
  // The form posts first/last separately; everything downstream wants one name.
  const name = s(b.name) || [s(b.firstName), s(b.lastName)].filter(Boolean).join(" ");
  const data: BookingPayload = {
    audience: s(b.audience) === "corporate" ? "corporate" : "church",
    name,
    email: s(b.email),
    phone: s(b.phone),
    organization: s(b.organization),
    eventType: s(b.eventType),
    eventDate: s(b.eventDate),
    location: s(b.location),
    audienceSize: s(b.audienceSize),
    message: s(b.message),
    role: s(b.role),
    orgWebsite: s(b.orgWebsite),
    altDate: s(b.altDate),
    attendance: s(b.attendance),
    industry: s(b.industry),
    orgSize: s(b.orgSize),
    focus: s(b.focus),
    budget: s(b.budget),
    travelCovered: s(b.travelCovered),
    heardAbout: s(b.heardAbout),
    timeline: s(b.timeline),
    extra: s(b.extra),
  };

  // Honeypot filled → treat as spam (caller silently drops). Skip other checks.
  if (s(b.website)) return { ok: true, data, spam: true };

  for (const f of REQUIRED_BOTH) {
    if (!data[f]) return { ok: false, error: "Please fill in all required fields." };
  }
  // Corporate asks for these two up front; the church tab leaves both optional.
  if (data.audience === "corporate" && (!data.industry || !data.eventType))
    return { ok: false, error: "Please fill in all required fields." };

  if (!EMAIL_RE.test(data.email)) return { ok: false, error: "Please enter a valid email address." };
  if (
    data.name.length > 120 ||
    data.organization.length > 160 ||
    data.location.length > 200 ||
    data.message.length > 5000 ||
    data.extra.length > 5000
  )
    return { ok: false, error: "One of the fields is too long." };

  return { ok: true, data, spam: false };
}

// The audience-specific answers as one readable block. Shared by the notification email and the
// `details` column so the pastor's inbox and the Strapi record never disagree.
export function summary(d: BookingPayload): string {
  const church = d.audience === "church";
  const rows: [string, string][] = [
    ["Role / title", d.role],
    ["Website", d.orgWebsite],
    [church ? "Average weekend attendance" : "Organization size", church ? d.attendance : d.orgSize],
    ["Industry / type", church ? "" : d.industry],
    ["Alternate date", d.altDate],
    [church ? "Event theme" : "Topic / focus area", d.focus],
    [church ? "Honorarium" : "Speaking fee budget", d.budget],
    ["Travel covered", d.travelCovered],
    ["Decision timeline", church ? "" : d.timeline],
    ["Heard about Caleb via", d.heardAbout],
    ["Anything else", d.extra],
  ];
  return rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}
