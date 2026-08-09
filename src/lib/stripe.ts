// Server-only Stripe (Checkout, hosted redirect). Only imported by the Node-runtime store routes.
// The secret key never reaches the client — hosted Checkout redirects to session.url, so no
// client-side Stripe.js is needed. Env: STRIPE_SECRET_KEY (+ optional STRIPE_WEBHOOK_SECRET later).
import Stripe from "stripe";
import { toCents } from "@/lib/pricing";
import type { PricedLine } from "@/lib/store-order";

const SECRET = process.env.STRIPE_SECRET_KEY;

export function stripeConfigured(): boolean {
  return Boolean(SECRET);
}

let client: Stripe | null = null;
function getStripe(): Stripe {
  if (!SECRET) throw new Error("Stripe not configured (STRIPE_SECRET_KEY)");
  // Reuse one client across warm invocations. apiVersion omitted → pinned to the account default.
  if (!client) client = new Stripe(SECRET);
  return client;
}

// Countries we ship to (Stripe requires an explicit list; there is no "all"). Mirrors the store's
// reach — extend as needed. Address collection gives us the shipping address like PayPal does.
const SHIP_TO: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] = [
  "US", "CA", "GB", "AU", "NZ", "IE",
];

export async function createCheckoutSession(opts: {
  lines: PricedLine[];
  shippingCents: number;
  currency: string;
  origin: string;
}): Promise<Stripe.Checkout.Session> {
  const { lines, shippingCents, currency, origin } = opts;
  const cur = currency.toLowerCase();

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((l) => ({
    quantity: l.qty,
    price_data: {
      currency: cur,
      unit_amount: toCents(l.unitPrice),
      product_data: {
        name: l.title,
        ...(l.description ? { description: l.description } : {}),
        metadata: { slug: l.slug, size: l.size ?? "" },
      },
    },
  }));

  const shipping_options: Stripe.Checkout.SessionCreateParams.ShippingOption[] =
    shippingCents > 0
      ? [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: "Shipping",
              fixed_amount: { amount: shippingCents, currency: cur },
            },
          },
        ]
      : [];

  return getStripe().checkout.sessions.create({
    mode: "payment",
    line_items,
    shipping_options,
    shipping_address_collection: { allowed_countries: SHIP_TO },
    success_url: `${origin}/store/order-confirmed?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/store/checkout`,
  });
}

// One-time donation Checkout session: a single ad-hoc line for the (server-clamped) amount, no
// shipping address, submit button reads "Donate". Donor metadata rides on the session so confirm
// can record it. Amount is already validated/clamped by donation.ts before this is called.
export async function createDonationSession(opts: {
  amountCents: number;
  currency: string;
  origin: string;
  metadata: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const { amountCents, currency, origin, metadata } = opts;
  const cur = currency.toLowerCase();
  return getStripe().checkout.sessions.create({
    mode: "payment",
    submit_type: "donate",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: cur,
          unit_amount: amountCents,
          product_data: {
            name: "Donation — Bite Size Theology",
            ...(metadata.fund ? { description: `Fund: ${metadata.fund}` } : {}),
          },
        },
      },
    ],
    metadata,
    success_url: `${origin}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/donate`,
  });
}

// Expand line items (+ their product for the slug/size metadata) so confirm can rebuild the order
// snapshot from what Stripe actually charged — no cart blob in session metadata, no size cap.
export async function retrieveSession(id: string): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(id, {
    expand: ["payment_intent", "line_items.data.price.product"],
  });
}
