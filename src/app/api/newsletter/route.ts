import { NextResponse } from "next/server";
import { validate } from "@/lib/newsletter";
import { allow, clientIp } from "@/lib/rate-limit";
import { sendConfirmation, siteUrl } from "@/lib/newsletter-email";
import {
  configured,
  create,
  findByEmail,
  newToken,
  setSubscribedCookie,
  update,
} from "@/lib/newsletter-store";

export const runtime = "nodejs";

const HOUR = 60 * 60 * 1000;
const PER_IP = 5; // signups per IP per hour
const PER_EMAIL = 3; // confirmation emails per address per hour

// Double opt-in signup. Nothing here ever puts an address on the list — it only creates a `pending`
// row and emails a link. Confirming is what makes someone `active`, which is what stops the form
// being used to subscribe other people.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const v = validate(body);
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
  // Honeypot → look exactly like success, but do nothing. Bots get no signal.
  if (v.spam) return NextResponse.json({ ok: true, state: "pending" }, { status: 200 });

  if (!allow(`nl:ip:${clientIp(req)}`, PER_IP, HOUR)) {
    return NextResponse.json(
      { ok: false, error: "Too many sign-ups from here. Please try again in a little while." },
      { status: 429 },
    );
  }

  if (!configured()) {
    return NextResponse.json(
      { ok: false, error: "The newsletter isn't set up yet. Please try again later." },
      { status: 503 },
    );
  }

  const { email, source } = v.data;
  const origin = siteUrl(req);

  try {
    const existing = await findByEmail(email);

    // Already confirmed — say so plainly rather than sending a second confirmation email.
    if (existing?.status === "active") {
      return setSubscribedCookie(NextResponse.json({ ok: true, state: "duplicate" }, { status: 200 }));
    }

    // Throttled by ADDRESS as well as by IP: without this, rotating IPs could be used to bury
    // someone else's inbox in confirmation emails.
    if (!allow(`nl:email:${email}`, PER_EMAIL, HOUR)) {
      return NextResponse.json(
        { ok: false, error: "We've already sent a confirmation to that address — please check your inbox." },
        { status: 429 },
      );
    }

    // Pending and unsubscribed are handled the same way: a fresh token and a new confirmation.
    // Rotating the token on every send kills any older link still sitting in an inbox.
    const confirmToken = newToken();
    const now = new Date().toISOString();
    if (existing) {
      await update(existing.documentId, {
        status: "pending",
        confirmToken,
        confirmedAt: null,
        subscribedAt: now, // this is a new opt-in, and its date is the one that matters
        source,
      });
    } else {
      await create({ email, status: "pending", confirmToken, subscribedAt: now, source });
    }

    const sent = await sendConfirmation(origin, email, confirmToken);
    if (!sent) {
      return NextResponse.json(
        { ok: false, error: "We couldn't send the confirmation email. Please try again shortly." },
        { status: 500 },
      );
    }

    return setSubscribedCookie(NextResponse.json({ ok: true, state: "pending" }, { status: 200 }));
  } catch (e) {
    // Unlike the contact/prayer routes, a failed write is fatal here — the row IS the subscription.
    console.error("newsletter: signup failed", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
