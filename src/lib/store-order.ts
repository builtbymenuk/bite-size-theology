// Provider-agnostic store checkout core, shared by the PayPal and Stripe routes so both gateways
// price and persist orders identically. Server-only (reads STRAPI_API_TOKEN).
import { getProduct, getStore } from "@/lib/cms";
import { computeTotals, type Totals } from "@/lib/pricing";
import { convert, decimalsFor, getRates, isSupported } from "@/lib/currency";
import type { Store } from "@/lib/content";

const STRAPI = process.env.STRAPI_URL;
const TOKEN = process.env.STRAPI_API_TOKEN;

export interface IncomingItem {
  slug?: string;
  size?: string;
  qty?: number;
}

export interface PricedLine {
  slug: string;
  title: string;
  size?: string;
  qty: number;
  unitPrice: number; // dollars, from Strapi
  description?: string; // e.g. "Size: M"
}

export type PricedCart =
  | {
      ok: true;
      lines: PricedLine[];
      totals: Totals;
      currency: string;
      decimals: number;
      store: Store;
    }
  | { ok: false; status: number; error: string };

// Reprices + validates the cart entirely from Strapi. The client only ever sends slug/size/qty,
// so a tampered price/qty in the browser can't change what's charged. Used by BOTH gateways.
//
// `wanted` is the buyer's chosen presentment currency. It comes from the browser, so it is checked
// against the offer list here — an unknown or unsupported code silently prices in the store's base
// currency rather than reaching Stripe/PayPal.
export async function priceCart(raw: unknown, wanted?: unknown): Promise<PricedCart> {
  const cart: IncomingItem[] = Array.isArray(raw) ? raw : [];
  if (!cart.length) return { ok: false, status: 400, error: "Your cart is empty." };

  const store = await getStore();
  const lines: PricedLine[] = [];

  for (const item of cart) {
    const slug = String(item?.slug ?? "");
    if (!slug) continue;
    const qty = Math.max(1, Math.trunc(Number(item?.qty) || 0));

    const product = await getProduct(slug);
    if (!product || product.soldOut) {
      return { ok: false, status: 409, error: `Sorry — "${slug}" is no longer available.` };
    }
    const size = item?.size ? String(item.size) : undefined;
    if (product.sizes.length && (!size || !product.sizes.includes(size))) {
      return { ok: false, status: 400, error: `Please choose a valid size for ${product.title}.` };
    }

    lines.push({
      slug,
      title: product.title,
      size,
      qty,
      unitPrice: product.price,
      description: size ? `Size: ${size}` : undefined,
    });
  }

  if (!lines.length) return { ok: false, status: 400, error: "Your cart is empty." };

  const base = (store.currency || "USD").toUpperCase();
  let target = isSupported(wanted) ? String(wanted).toUpperCase() : base;
  let shippingFee = store.shippingFee;

  // Convert each unit price and the shipping fee on its own, rounding each to the target precision
  // BEFORE totalling. Rounding per line (not on the total) is what keeps PayPal's
  // Σ(unit × qty) === item_total invariant true after conversion.
  if (target !== base) {
    const rate = (await getRates())[target];
    if (rate) {
      for (const l of lines) l.unitPrice = convert(l.unitPrice, rate, target);
      shippingFee = convert(shippingFee, rate, target);
    } else {
      // No rate for a code we offer shouldn't happen (the fallback table covers all of them), but
      // charging base-currency numbers under a foreign label would be a real overcharge. Stay in base.
      target = base;
    }
  }

  const decimals = decimalsFor(target);
  const totals = computeTotals(
    lines.map((l) => ({ unitPrice: l.unitPrice, qty: l.qty })),
    shippingFee,
    decimals,
  );
  return { ok: true, lines, totals, currency: target, decimals, store };
}

// Human-readable line snapshot for the Strapi Orders record. Reprices titles/prices from Strapi
// by slug so the admin sees real product names even if the client sent only slugs.
export async function snapshotItems(cart: IncomingItem[]) {
  const out: Array<Record<string, unknown>> = [];
  for (const item of cart) {
    const slug = String(item?.slug ?? "");
    if (!slug) continue;
    const p = await getProduct(slug).catch(() => null);
    out.push({
      slug,
      title: p?.title ?? slug,
      size: item?.size ?? null,
      qty: Math.max(1, Math.trunc(Number(item?.qty) || 0)),
      unitPrice: p?.price ?? null,
    });
  }
  return out;
}

export interface NormalizedOrder {
  orderNumber: string;
  email: string;
  payerName: string;
  provider: "paypal" | "stripe";
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  shippingAddress: Record<string, unknown>;
}

// Idempotency guard: has an order for this provider payment already been saved? Returns the existing
// record (or null). Prevents a page refresh / repeated confirm from double-writing. Needs the token.
export async function orderExists(
  provider: "paypal" | "stripe",
  ref: string,
): Promise<any | null> {
  if (!STRAPI || !TOKEN || !ref) return null;
  const field = provider === "stripe" ? "stripeSessionId" : "paypalOrderId";
  try {
    const res = await fetch(
      `${STRAPI}/api/orders?filters[${field}][$eq]=${encodeURIComponent(ref)}`,
      { headers: { Authorization: `Bearer ${TOKEN}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json())?.data?.[0] ?? null;
  } catch {
    return null;
  }
}

// Best-effort persist to Strapi. A failed write must NEVER fail a paid order — the money already
// moved; the caller logs and moves on. Returns true if saved, false if skipped/failed.
export async function saveOrder(
  o: NormalizedOrder,
  items: Array<Record<string, unknown>>,
): Promise<boolean> {
  if (!STRAPI || !TOKEN) {
    console.warn("saveOrder: STRAPI_API_TOKEN unset — order not saved to Strapi");
    return false;
  }
  const res = await fetch(`${STRAPI}/api/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        orderNumber: o.orderNumber,
        email: o.email,
        payerName: o.payerName,
        items,
        subtotal: o.subtotal,
        shipping: o.shipping,
        total: o.total,
        currency: o.currency,
        status: "paid",
        provider: o.provider,
        paypalOrderId: o.paypalOrderId,
        paypalCaptureId: o.paypalCaptureId,
        stripeSessionId: o.stripeSessionId,
        stripePaymentIntentId: o.stripePaymentIntentId,
        shippingAddress: o.shippingAddress,
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi order create failed (${res.status})`);
  return true;
}
