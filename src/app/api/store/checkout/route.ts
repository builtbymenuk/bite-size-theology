import { NextResponse } from "next/server";
import { priceCart } from "@/lib/store-order";
import {
  buildCreateOrderBody,
  createOrder,
  paypalConfigured,
  type PayPalLineItem,
} from "@/lib/paypal";

export const runtime = "nodejs";

// Creates a PayPal order from the cart. Pricing/validation is shared with Stripe via priceCart —
// the client sends only slug/size/qty, so the browser can never alter what PayPal charges.
export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
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

  const payPalItems: PayPalLineItem[] = priced.lines.map((l) => ({
    name: l.title,
    quantity: l.qty,
    unitValue: l.unitPrice.toFixed(2),
    description: l.description,
  }));

  try {
    const order = await createOrder(
      buildCreateOrderBody({
        currency: priced.currency,
        items: payPalItems,
        itemTotal: priced.totals.subtotal,
        shipping: priced.totals.shipping,
        total: priced.totals.total,
      }),
    );
    return NextResponse.json({ id: order.id });
  } catch (e) {
    console.error("checkout: PayPal create failed", e);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
