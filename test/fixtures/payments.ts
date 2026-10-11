// Shared provider responses for the money-path route tests. Builders (not constants) so a test can
// tweak one field without leaking the change into another test.
import type Stripe from "stripe";
import type { PayPalCapture } from "@/lib/paypal";

export const PAYPAL_SANDBOX = "api-m.sandbox.paypal.com";

/** A COMPLETED PayPal capture: order PAYORDER123, capture 3XY45678ABCDEFGH for `value` `currency`. */
export function paypalCaptureCompleted(
  value = "50.99",
  currency = "USD",
  overrides: Partial<PayPalCapture> = {},
): PayPalCapture {
  return {
    id: "PAYORDER123",
    status: "COMPLETED",
    payer: { email_address: "payer@example.com", name: { given_name: "Ada", surname: "Lovelace" } },
    purchase_units: [
      {
        amount: { value, currency_code: currency },
        payments: { captures: [{ id: "3XY45678abcdefgh", amount: { value, currency_code: currency } }] },
        shipping: {
          name: { full_name: "Ada Lovelace" },
          address: { address_line_1: "1 Main St", admin_area_2: "Springfield", country_code: "US" },
        },
      },
    ],
    ...overrides,
  };
}

export function paypalCapturePending(): PayPalCapture {
  return { ...paypalCaptureCompleted(), status: "PENDING" };
}

/** stubFetch routes for a PayPal sandbox that issues a token and answers `path` with `reply`. */
export function paypalRoutes(reply: { status?: number; json?: unknown }) {
  return {
    [`${PAYPAL_SANDBOX}/v1/oauth2/token`]: { json: { access_token: "pp-access" } },
    [`${PAYPAL_SANDBOX}/v2/checkout/orders`]: reply,
  };
}

/** A paid Stripe Checkout session (expanded the way retrieveSession() asks for). */
export function stripeSessionPaid(overrides: Record<string, unknown> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    object: "checkout.session",
    payment_status: "paid",
    amount_subtotal: 7500,
    amount_total: 8099,
    total_details: { amount_shipping: 599, amount_discount: 0, amount_tax: 0 },
    currency: "usd",
    payment_intent: { id: "pi_3abcdefgh12345678" },
    metadata: {},
    customer_details: { email: "card@example.com", name: "Card Holder", address: null },
    collected_information: {
      shipping_details: {
        name: "Ship To Name",
        address: { line1: "2 High St", city: "London", country: "GB", postal_code: "N1", line2: null, state: null },
      },
    },
    line_items: {
      object: "list",
      data: [
        {
          quantity: 1,
          description: "Hoodie",
          price: {
            unit_amount: 4500,
            product: { name: "Hoodie", metadata: { slug: "call-on-jesus-vintage-faded-hoodie", size: "M" } },
          },
        },
        {
          quantity: 1,
          description: "Tee",
          price: { unit_amount: 3000, product: "prod_unexpanded" },
        },
      ],
    },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

export function stripeSessionUnpaid(): Stripe.Checkout.Session {
  return stripeSessionPaid({ payment_status: "unpaid" });
}
