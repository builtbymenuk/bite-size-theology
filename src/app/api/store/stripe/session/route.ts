import { NextResponse } from "next/server";
import { priceCart } from "@/lib/store-order";
import { stripeConfigured, createCheckoutSession } from "@/lib/stripe";

export const runtime = "nodejs";

// Starts a Stripe Checkout (hosted) session from the cart. The client sends only slug/size/qty;
// priceCart reprices everything from Strapi, so the browser can't set what Stripe charges.
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Card payments are not configured." }, { status: 503 });
  }

  let items: unknown;
  try {
    items = (await req.json())?.items;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const priced = await priceCart(items);
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: priced.status });
  }

  try {
    const session = await createCheckoutSession({
      lines: priced.lines,
      shippingCents: priced.totals.shippingCents,
      currency: priced.currency,
      origin: new URL(req.url).origin,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe/session: create failed", e);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
