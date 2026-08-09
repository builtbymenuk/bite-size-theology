// Pure, dependency-free validation for the contact form, split out from the route so it can be
// unit-checked without pulling in next/server or the CMS chain (see contact.check.ts).

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  company?: string; // honeypot
}

export type Validated =
  | { ok: true; data: ContactPayload; spam: boolean }
  | { ok: false; error: string };

// Trust-boundary validation for POST /api/contact.
export function validate(raw: unknown): Validated {
  const b = (raw ?? {}) as Record<string, unknown>;
  const name = String(b.name ?? "").trim();
  const email = String(b.email ?? "").trim();
  const subject = String(b.subject ?? "").trim();
  const message = String(b.message ?? "").trim();
  const company = String(b.company ?? "").trim();

  // Honeypot filled → treat as spam (caller silently drops). Skip other checks.
  if (company) return { ok: true, data: { name, email, subject, message }, spam: true };

  if (!name || !email || !message)
    return { ok: false, error: "Please fill in your name, email, and message." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (name.length > 120 || subject.length > 160 || message.length > 5000)
    return { ok: false, error: "One of the fields is too long." };

  return { ok: true, data: { name, email, subject, message }, spam: false };
}
