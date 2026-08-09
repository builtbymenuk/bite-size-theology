// Pure, dependency-free validation for the prayer request form, split out from the route so it can
// be unit-checked without pulling in next/server or the CMS chain (see prayer.check.ts).
import { EMAIL_RE } from "./contact";

export interface PrayerPayload {
  request: string;
  name: string;
  email: string;
  urgent: boolean;
  website?: string; // honeypot
}

export type Validated =
  | { ok: true; data: PrayerPayload; spam: boolean }
  | { ok: false; error: string };

const s = (v: unknown) => String(v ?? "").trim();
const bool = (v: unknown) => v === true || v === "true" || v === "on" || v === "1";

// Trust-boundary validation for POST /api/prayer. Name and email are optional (anonymous is fine);
// only the request text is required.
export function validate(raw: unknown): Validated {
  const b = (raw ?? {}) as Record<string, unknown>;
  const data: PrayerPayload = {
    request: s(b.request),
    name: s(b.name),
    email: s(b.email),
    urgent: bool(b.urgent),
  };

  // Honeypot filled → treat as spam (caller silently drops). Skip other checks.
  if (s(b.website)) return { ok: true, data, spam: true };

  if (!data.request) return { ok: false, error: "Please share what we can pray for." };
  if (data.email && !EMAIL_RE.test(data.email))
    return { ok: false, error: "Please enter a valid email address (or leave it blank)." };
  if (data.request.length > 5000 || data.name.length > 120)
    return { ok: false, error: "One of the fields is too long." };

  return { ok: true, data, spam: false };
}
