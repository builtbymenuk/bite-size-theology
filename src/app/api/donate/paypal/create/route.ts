import { NextResponse } from "next/server";
import { paypalConfigured, createOrder, buildCreateOrderBody } from "@/lib/paypal";
import { validateAmount } from "@/lib/donation";
import { formatUSD } from "@/lib/pricing";

export const runtime = "nodejs";

// Creates a PayPal (Orders v2) order for a one-time donation — a single synthetic line for the
// server-validated amount, no shipping. Donor metadata is sent again at capture (non-financial).
export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "PayPal giving is not configured." }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const amount = validateAmount(body?.amount);
  if (!amount.ok) return NextResponse.json({ error: amount.error }, { status: 400 });

  const value = (amount.cents / 100).toFixed(2);
  try {
    const order = await createOrder(
      buildCreateOrderBody({
        currency: "USD",
        items: [{ name: "Donation — Bite Size Theology", quantity: 1, unitValue: value }],
        itemTotal: value,
        shipping: "0.00",
        total: value,
      }),
    );
    return NextResponse.json({ id: order.id });
  } catch (e) {
    console.error("donate/paypal/create: failed", e);
    return NextResponse.json({ error: `Could not start giving (${formatUSD(amount.cents / 100)}).` }, { status: 502 });
  }
}
