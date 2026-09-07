import { NextResponse } from "next/server";
import { unsubscribeContact } from "@/lib/newsletter-audience";
import { siteUrl } from "@/lib/newsletter-email";
import { clearSubscribedCookie, configured, findByToken, update } from "@/lib/newsletter-store";

export const runtime = "nodejs";

// One click, no login, no confirmation step — the link at the foot of every list email. The row is
// kept (not deleted) so a later signup can't quietly resurrect an address someone opted out of
// without a fresh confirmation.
export async function GET(req: Request) {
  const origin = siteUrl(req);
  const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";
  const done = (state?: string) =>
    NextResponse.redirect(new URL(`/newsletter/unsubscribed${state ? `?state=${state}` : ""}`, origin));

  if (!token || !configured()) return done("invalid");

  try {
    const sub = await findByToken(token);
    if (!sub) return done("invalid");
    if (sub.status !== "unsubscribed") {
      await update(sub.documentId, { status: "unsubscribed" });
    }
    // Flag them in Resend too, so a broadcast can't reach someone who has opted out here.
    // Best-effort, but re-asserted on every click of the link and by /api/newsletter/sync.
    await unsubscribeContact(sub.email);
    return clearSubscribedCookie(done());
  } catch (e) {
    console.error("newsletter: unsubscribe failed", e);
    return done("error");
  }
}
