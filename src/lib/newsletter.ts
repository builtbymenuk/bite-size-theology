// Pure, dependency-free validation for the newsletter signup, split out from the routes so it can
// be unit-checked without pulling in next/server or the CMS chain (see newsletter.check.ts).
import { EMAIL_RE } from "./contact";

export type Source = "footer" | "popup";

export interface NewsletterPayload {
  email: string;
  source: Source;
  website?: string; // honeypot
}

export type Validated =
  | { ok: true; data: NewsletterPayload; spam: boolean }
  | { ok: false; error: string };

// Lowercased, not just trimmed: the DB's unique index is case-sensitive, so without this
// "Jane@x.com" and "jane@x.com" become two rows and two confirmation emails for one person.
const normalize = (v: unknown) => String(v ?? "").trim().toLowerCase();

// Trust-boundary validation for POST /api/newsletter. Only the address is required — `source` is
// a UI hint, so an unknown value is quietly treated as the footer rather than rejected.
export function validate(raw: unknown): Validated {
  const b = (raw ?? {}) as Record<string, unknown>;
  const email = normalize(b.email);
  const data: NewsletterPayload = { email, source: b.source === "popup" ? "popup" : "footer" };

  // Honeypot filled → treat as spam (caller silently drops). Skip other checks.
  if (String(b.website ?? "").trim()) return { ok: true, data, spam: true };

  if (!email) return { ok: false, error: "Please enter your email address." };
  // 254 is the RFC 5321 ceiling and Strapi's email column is varchar(255) — check length before
  // the regex so a megabyte-long "address" never reaches it.
  if (email.length > 254) return { ok: false, error: "That email address is too long." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };

  return { ok: true, data, spam: false };
}
