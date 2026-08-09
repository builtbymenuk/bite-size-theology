import { NextResponse } from "next/server";
import { stripeConfigured, retrieveSession } from "@/lib/stripe";
import { saveDonation, donationExists } from "@/lib/donation";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Called on return from Stripe's hosted page. Verifies the session is paid, then idempotently
// records the donation (a refresh returns the existing gift, never a duplicate).
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Card giving is not configured." }, { status: 503 });
  }

  let sessionId = "";
  try {
    sessionId = String((await req.json())?.session_id ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!sessionId) return NextResponse.json({ error: "Missing session id." }, { status: 400 });

  let session: Stripe.Checkout.Session;
  try {
    session = await retrieveSession(sessionId);
  } catch (e) {
    console.error("donate/stripe/confirm: retrieve failed", e);
    return NextResponse.json({ error: "Could not verify your gift." }, { status: 502 });
  }
  if (session.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Payment was not completed.", status: session.payment_status },
      { status: 402 },
    );
  }

  const amount = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? "usd").toUpperCase();
  const m = session.metadata ?? {};
  const pi = session.payment_intent;

  const existing = await donationExists("stripe", session.id);
  if (!existing) {
    await saveDonation({
      amount,
      currency,
      name: m.name || session.customer_details?.name || undefined,
      email: m.email || session.customer_details?.email || undefined,
      fund: m.fund || undefined,
      message: m.message || undefined,
      anonymous: m.anonymous === "true",
      provider: "stripe",
      stripeSessionId: session.id,
      stripePaymentIntentId: typeof pi === "string" ? pi : pi?.id ?? undefined,
    }).catch((e) => console.error("donate/stripe/confirm: save failed", e));
  }

  return NextResponse.json({ ok: true, amount, currency });
}
