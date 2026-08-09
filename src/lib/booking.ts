// Pure, dependency-free validation for the Book Caleb form, split out from the route so it can be
// unit-checked without pulling in next/server or the CMS chain (see booking.check.ts).
import { EMAIL_RE } from "./contact";

export interface BookingPayload {
  name: string;
  email: string;
  phone: string;
  organization: string;
  eventType: string;
  eventDate: string;
  location: string;
  audienceSize: string;
  message: string;
  website?: string; // honeypot
}

export type Validated =
  | { ok: true; data: BookingPayload; spam: boolean }
  | { ok: false; error: string };

const s = (v: unknown) => String(v ?? "").trim();

// Trust-boundary validation for POST /api/book.
export function validate(raw: unknown): Validated {
  const b = (raw ?? {}) as Record<string, unknown>;
  const data: BookingPayload = {
    name: s(b.name),
    email: s(b.email),
    phone: s(b.phone),
    organization: s(b.organization),
    eventType: s(b.eventType),
    eventDate: s(b.eventDate),
    location: s(b.location),
    audienceSize: s(b.audienceSize),
    message: s(b.message),
  };

  // Honeypot filled → treat as spam (caller silently drops). Skip other checks.
  if (s(b.website)) return { ok: true, data, spam: true };

  if (!data.name || !data.email || !data.organization || !data.eventType || !data.eventDate || !data.location || !data.message)
    return { ok: false, error: "Please fill in all required fields." };
  if (!EMAIL_RE.test(data.email)) return { ok: false, error: "Please enter a valid email address." };
  if (data.name.length > 120 || data.organization.length > 160 || data.location.length > 200 || data.message.length > 5000)
    return { ok: false, error: "One of the fields is too long." };

  return { ok: true, data, spam: false };
}
