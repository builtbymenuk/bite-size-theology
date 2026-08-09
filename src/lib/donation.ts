// One-time donation core, shared by the PayPal and Stripe donate routes. Server-only.
// Unlike the store (which prices a cart from Strapi), a donation trusts a CLIENT-SUPPLIED amount —
// so validateAmount() is the trust boundary: it clamps to a sane min/max and rejects junk.
import { toCents } from "@/lib/pricing";

const STRAPI = process.env.STRAPI_URL;
const TOKEN = process.env.STRAPI_API_TOKEN;

export const MIN_CENTS = 100; // $1
export const MAX_CENTS = 5_000_000; // $50,000

export type AmountResult =
  | { ok: true; cents: number }
  | { ok: false; error: string };

// Accepts dollars (number or string). Rejects NaN/≤0/over-max; floors to whole cents.
export function validateAmount(raw: unknown): AmountResult {
  const dollars = typeof raw === "string" ? Number(raw.replace(/[^0-9.]/g, "")) : Number(raw);
  if (!Number.isFinite(dollars) || dollars <= 0) {
    return { ok: false, error: "Please enter a donation amount." };
  }
  const cents = toCents(dollars);
  if (cents < MIN_CENTS) return { ok: false, error: "Minimum donation is $1." };
  if (cents > MAX_CENTS) return { ok: false, error: "Please contact us for gifts over $50,000." };
  return { ok: true, cents };
}

export interface DonationRecord {
  amount: number; // dollars
  currency: string;
  name?: string;
  email?: string;
  fund?: string;
  message?: string;
  anonymous?: boolean;
  provider: "paypal" | "stripe";
  paypalOrderId?: string;
  paypalCaptureId?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}

// Non-financial donor fields sent from the client (amount is always taken from the provider).
export interface DonorMeta {
  name?: string;
  email?: string;
  fund?: string;
  message?: string;
  anonymous?: boolean;
}

// Idempotency guard: has a donation for this provider payment already been saved? Needs the token.
export async function donationExists(
  provider: "paypal" | "stripe",
  ref: string,
): Promise<any | null> {
  if (!STRAPI || !TOKEN || !ref) return null;
  const field = provider === "stripe" ? "stripeSessionId" : "paypalOrderId";
  try {
    const res = await fetch(
      `${STRAPI}/api/donations?filters[${field}][$eq]=${encodeURIComponent(ref)}`,
      { headers: { Authorization: `Bearer ${TOKEN}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json())?.data?.[0] ?? null;
  } catch {
    return null;
  }
}

// Best-effort persist to Strapi. A failed write must NEVER fail a completed gift — the money already
// moved; the caller logs and moves on. Returns true if saved.
export async function saveDonation(d: DonationRecord): Promise<boolean> {
  if (!STRAPI || !TOKEN) {
    console.warn("saveDonation: STRAPI_API_TOKEN unset — donation not saved to Strapi");
    return false;
  }
  const res = await fetch(`${STRAPI}/api/donations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        amount: d.amount,
        currency: d.currency,
        name: d.anonymous ? undefined : d.name || undefined,
        email: d.email || undefined,
        fund: d.fund || undefined,
        message: d.message || undefined,
        anonymous: !!d.anonymous,
        provider: d.provider,
        status: "completed",
        paypalOrderId: d.paypalOrderId,
        paypalCaptureId: d.paypalCaptureId,
        stripeSessionId: d.stripeSessionId,
        stripePaymentIntentId: d.stripePaymentIntentId,
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi donation create failed (${res.status})`);
  return true;
}
