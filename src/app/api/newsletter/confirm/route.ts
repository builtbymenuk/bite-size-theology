import { NextResponse } from "next/server";
import { addContact } from "@/lib/newsletter-audience";
import { sendWelcome, siteUrl } from "@/lib/newsletter-email";
import { configured, findByToken, setSubscribedCookie, update } from "@/lib/newsletter-store";

export const runtime = "nodejs";

// The second half of the double opt-in — the link in the confirmation email. This is usually opened
// on a different device from the one that signed up, which is exactly why it also drops the
// suppression cookie: it's the one moment we can mark a second browser as subscribed.
export async function GET(req: Request) {
  const origin = siteUrl(req);
  const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";
  const done = (state?: string) =>
    NextResponse.redirect(new URL(`/newsletter/confirmed${state ? `?state=${state}` : ""}`, origin));

  if (!token || !configured()) return done("invalid");

  try {
    const sub = await findByToken(token);
    // No match, or they've since unsubscribed — an old link. Don't quietly re-subscribe them.
    if (!sub || sub.status === "unsubscribed") return done("invalid");
    // Re-clicking a link that already worked is normal (forwarded mail, a second device). Idempotent.
    if (sub.status === "active") return setSubscribedCookie(done());

    await update(sub.documentId, { status: "active", confirmedAt: new Date().toISOString() });
    // Both best-effort: they are confirmed the moment the Strapi row flips, and neither a failed
    // welcome email nor a failed Resend sync should undo that. /api/newsletter/sync repairs drift.
    await sendWelcome(origin, sub.email, sub.confirmToken);
    await addContact(sub.email);
    return setSubscribedCookie(done());
  } catch (e) {
    console.error("newsletter: confirm failed", e);
    return done("error");
  }
}
