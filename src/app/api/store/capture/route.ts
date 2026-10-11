import { NextResponse } from "next/server";
import { captureOrder, getOrder, paypalConfigured, type PayPalCapture } from "@/lib/paypal";
import { toMinor } from "@/lib/pricing";
import {
  priceCart,
  snapshotItems,
  saveOrder,
  orderExists,
  type IncomingItem,
  type NormalizedOrder,
} from "@/lib/store-order";

export const runtime = "nodejs";

// Verifies the approved PayPal order against a server-repriced cart, captures it, then best-effort
// persists it to Strapi. Money figures come straight from PayPal's capture response; the line
// snapshot is rebuilt from Strapi.

// Live FX rates refresh every 24h, so a checkout that straddles a refresh can reprice a converted
// cart a little differently from the order PayPal approved. Allow that much underpayment for
// converted currencies only; the base currency must match exactly. A forged order (e.g. $1 for a
// $50 cart) is nowhere near this.
const FX_TOLERANCE = 0.02;
export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  let orderID = "";
  let cart: IncomingItem[] = [];
  let currency: unknown;
  try {
    const body = await req.json();
    orderID = String(body?.orderID ?? "");
    cart = Array.isArray(body?.items) ? body.items : [];
    currency = body?.currency;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!orderID) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  // The order id comes from the browser, and anyone holding our public PayPal client id can create
  // an order for any amount. So before taking the money, check the approved order really is for
  // this cart, repriced on the server.
  const priced = await priceCart(cart, currency);
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: priced.status });
  }
  let approved: PayPalCapture;
  try {
    approved = await getOrder(orderID);
  } catch (e) {
    console.error("capture: PayPal order lookup failed", e);
    return NextResponse.json({ error: "Payment could not be completed." }, { status: 502 });
  }
  const amount = approved.purchase_units?.[0]?.amount;
  const paidMinor = toMinor(Number(amount?.value ?? 0), priced.decimals);
  const expectedMinor = priced.totals.totalCents;
  const converted = priced.currency !== (priced.store.currency || "USD").toUpperCase();
  const minimum = converted ? Math.floor(expectedMinor * (1 - FX_TOLERANCE)) : expectedMinor;
  if ((amount?.currency_code ?? "").toUpperCase() !== priced.currency || paidMinor < minimum) {
    console.error("capture: approved amount doesn't match the cart", {
      orderID,
      approved: amount,
      expected: priced.totals.total,
      currency: priced.currency,
    });
    return NextResponse.json(
      { error: "The payment amount doesn't match your cart. You have not been charged." },
      { status: 409 },
    );
  }

  let capture: PayPalCapture;
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
    // Fill them from the server repricing above; the captured total stays authoritative.
    const unit = 10 ** priced.decimals;
    summary.subtotal = priced.totals.subtotalCents / unit;
    summary.shipping = priced.totals.shippingCents / unit;
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

function summarize(capture: PayPalCapture): NormalizedOrder {
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
