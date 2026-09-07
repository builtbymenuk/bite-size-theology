// Mirrors confirmed subscribers into Resend's contact list — the list the client actually sends
// from (Resend dashboard → Broadcasts). Strapi stays the record of truth for when and where
// somebody signed up; Resend is only the sending list.
//
// Note on the API: Resend deprecated Audiences in favour of Segments, and contacts are now
// account-level (POST /contacts, no audience in the path). Targeting is done with segments.
//
// Everything here is BEST EFFORT and never throws. A Resend hiccup must not fail a confirmation
// or an unsubscribe — the Strapi row is what makes those real. Drift is repaired by
// GET /api/newsletter/sync.

const KEY = process.env.RESEND_API_KEY;

// Optional. Unset = the contact is created account-wide, which is correct while this site is the
// only thing feeding Resend contacts. Set it once there's a second list worth keeping separate.
const SEGMENT = process.env.RESEND_SEGMENT_ID;

const BASE = "https://api.resend.com/contacts";

export const audienceConfigured = (): boolean => Boolean(KEY);

async function call(url: string, method: "POST" | "PATCH", body: unknown): Promise<boolean> {
  if (!KEY) return false;
  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Called when someone confirms. Creating a contact that already exists fails, so fall back to
// clearing their unsubscribed flag — that's the resubscribe path, which our flow allows.
export async function addContact(email: string): Promise<boolean> {
  const created = await call(BASE, "POST", {
    email,
    unsubscribed: false,
    ...(SEGMENT ? { segments: [{ id: SEGMENT }] } : {}),
  });
  if (created) return true;
  return call(`${BASE}/${encodeURIComponent(email)}`, "PATCH", { unsubscribed: false });
}

// Called when someone uses our unsubscribe link. Flagged rather than deleted, so that being
// re-added later can't silently start mailing them again.
export function unsubscribeContact(email: string): Promise<boolean> {
  return call(`${BASE}/${encodeURIComponent(email)}`, "PATCH", { unsubscribed: true });
}
