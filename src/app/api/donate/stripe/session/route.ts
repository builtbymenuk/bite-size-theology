import { NextResponse } from "next/server";
import { stripeConfigured, createDonationSession } from "@/lib/stripe";
import { validateAmount, type DonorMeta } from "@/lib/donation";

export const runtime = "nodejs";

// Creates a Stripe hosted Checkout session for a one-time donation. Amount is client-supplied and
// validated/clamped here; donor metadata rides on the session for confirm to record.
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Card giving is not configured." }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const amount = validateAmount(body?.amount);
  if (!amount.ok) return NextResponse.json({ error: amount.error }, { status: 400 });

  const meta: DonorMeta = {
    name: String(body?.name ?? "").trim(),
    email: String(body?.email ?? "").trim(),
    fund: String(body?.fund ?? "").trim(),
    message: String(body?.message ?? "").trim().slice(0, 500),
    anonymous: !!body?.anonymous,
  };

  try {
    const origin = new URL(req.url).origin;
    const session = await createDonationSession({
      amountCents: amount.cents,
      currency: "USD",
      origin,
      metadata: {
        name: meta.name || "",
        email: meta.email || "",
        fund: meta.fund || "",
        message: meta.message || "",
        anonymous: meta.anonymous ? "true" : "",
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("donate/stripe/session: failed", e);
    return NextResponse.json({ error: "Could not start giving. Please try again." }, { status: 502 });
  }
}
