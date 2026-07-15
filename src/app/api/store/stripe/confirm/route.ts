import { NextResponse } from "next/server";
import { stripeConfigured, retrieveSession } from "@/lib/stripe";
import { saveOrder, orderExists } from "@/lib/store-order";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Called on return from Stripe's hosted page. Verifies the session is paid, then idempotently
// records the order in Strapi (a page refresh returns the existing order, never a duplicate).
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Card payments are not configured." }, { status: 503 });
  }

  let sessionId = "";
  try {
    sessionId = String((await req.json())?.session_id ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await retrieveSession(sessionId);
  } catch (e) {
    console.error("stripe/confirm: retrieve failed", e);
    return NextResponse.json({ error: "Could not verify payment." }, { status: 502 });
  }
  if (session.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Payment was not completed.", status: session.payment_status },
      { status: 402 },
    );
  }

  const summary = summarize(session);

  // Idempotency: if this session already produced an order, return it without writing again.
  const existing = await orderExists("stripe", session.id);
  if (existing) {
    return NextResponse.json({
      ok: true,
      orderNumber: existing.orderNumber ?? summary.orderNumber,
      email: existing.email ?? summary.email,
      total: existing.total ?? summary.total,
      currency: existing.currency ?? summary.currency,
    });
  }

  // Rebuild the line snapshot from the expanded line items (slug/size live in each product's
  // metadata) — the amounts are exactly what Stripe charged, and there's no cart-size limit.
  const items = snapshotFromSession(session);

  await saveOrder(summary, items).catch((e) =>
    console.error("stripe/confirm: order save failed", e),
  );

  return NextResponse.json({
    ok: true,
    orderNumber: summary.orderNumber,
    email: summary.email,
    total: summary.total,
    currency: summary.currency,
  });
}

// Line snapshot from the expanded Checkout line items. Each ad-hoc product carries the slug/size we
// stamped at session creation; quantity + unit_amount are what Stripe charged.
function snapshotFromSession(session: Stripe.Checkout.Session) {
  const rows = session.line_items?.data ?? [];
  return rows.map((li) => {
    const product = li.price?.product;
    const meta =
      product && typeof product === "object" && "metadata" in product
        ? product.metadata
        : {};
    const name =
      product && typeof product === "object" && "name" in product
        ? product.name
        : null;
    return {
      slug: meta?.slug || null,
      title: name || li.description || null,
      size: meta?.size || null,
      qty: li.quantity ?? 1,
      unitPrice: (li.price?.unit_amount ?? 0) / 100,
    };
  });
}

function summarize(session: Stripe.Checkout.Session) {
  const pi = session.payment_intent;
  const paymentIntentId = typeof pi === "string" ? pi : pi?.id ?? "";
  const details = session.customer_details;
  // Newer Stripe API nests the collected shipping address here (was top-level session.shipping_details).
  const ship = session.collected_information?.shipping_details;
  const name = ship?.name ?? details?.name ?? "";
  return {
    orderNumber: paymentIntentId
      ? `BST-${paymentIntentId.slice(-8).toUpperCase()}`
      : session.id,
    provider: "stripe" as const,
    email: details?.email ?? "",
    payerName: name,
    subtotal: (session.amount_subtotal ?? 0) / 100,
    shipping: (session.total_details?.amount_shipping ?? 0) / 100,
    total: (session.amount_total ?? 0) / 100,
    currency: (session.currency ?? "usd").toUpperCase(),
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    shippingAddress: {
      name,
      ...((ship?.address ?? details?.address) ?? {}),
    },
  };
}
