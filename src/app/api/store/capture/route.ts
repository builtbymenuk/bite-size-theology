import { NextResponse } from "next/server";
import { captureOrder, paypalConfigured } from "@/lib/paypal";
import {
  priceCart,
  snapshotItems,
  saveOrder,
  orderExists,
  type IncomingItem,
  type NormalizedOrder,
} from "@/lib/store-order";

export const runtime = "nodejs";

// Captures the approved PayPal order, then best-effort persists it to Strapi. Money figures come
// straight from PayPal's capture response (authoritative); the line snapshot is rebuilt from Strapi.
export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  let orderID = "";
  let cart: IncomingItem[] = [];
  try {
    const body = await req.json();
    orderID = String(body?.orderID ?? "");
    cart = Array.isArray(body?.items) ? body.items : [];
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!orderID) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  let capture: any;
  try {
    capture = await captureOrder(orderID);
  } catch (e) {
    console.error("capture: PayPal capture failed", e);
    return NextResponse.json({ error: "Payment could not be completed." }, { status: 502 });
  }
  if (capture?.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Payment was not completed.", status: capture?.status },
      { status: 402 },
    );
  }

  const summary = summarize(capture);

  // Idempotency: a re-submitted capture returns the existing order instead of writing a duplicate.
  const existing = await orderExists("paypal", summary.paypalOrderId ?? "");
  if (!existing) {
    // PayPal's capture response omits amount.breakdown, so summarize() leaves subtotal/shipping at 0.
    // Reprice from Strapi (the same server-authoritative math the order was created with) to fill them
    // in; the captured total stays authoritative. Best-effort — a paid order must still save if this misses.
    const priced = await priceCart(cart);
    if (priced.ok) {
      summary.subtotal = priced.totals.subtotalCents / 100;
      summary.shipping = priced.totals.shippingCents / 100;
    }
    const items = await snapshotItems(cart);
    await saveOrder(summary, items).catch((e) =>
      console.error("capture: order save failed", e),
    );
  }

  return NextResponse.json({
    ok: true,
    orderNumber: summary.orderNumber,
    email: summary.email,
    total: summary.total,
    currency: summary.currency,
  });
}

function summarize(capture: any): NormalizedOrder {
  const pu = capture?.purchase_units?.[0] ?? {};
  const cap = pu?.payments?.captures?.[0] ?? {};
  const payer = capture?.payer ?? {};
  const shipping = pu?.shipping ?? {};
  const breakdown = pu?.amount?.breakdown ?? {};
  const captureId: string = cap?.id || "";
  return {
    orderNumber: captureId ? `BST-${captureId.slice(-8).toUpperCase()}` : capture.id,
    provider: "paypal",
    paypalOrderId: capture.id as string,
    paypalCaptureId: captureId,
    email: payer?.email_address || "",
    payerName: [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(" "),
    subtotal: Number(breakdown?.item_total?.value ?? 0),
    shipping: Number(breakdown?.shipping?.value ?? 0),
    total: Number(cap?.amount?.value ?? 0),
    currency: cap?.amount?.currency_code || "USD",
    shippingAddress: {
      name: shipping?.name?.full_name ?? "",
      ...(shipping?.address ?? {}),
    },
  };
}
