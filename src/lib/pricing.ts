// Money math for the store. Amounts are computed in INTEGER CENTS to avoid float drift
// (0.1 + 0.2 !== 0.3), then formatted to PayPal's 2-decimal "value" strings on the way out.
// Runnable check: node --experimental-strip-types src/lib/pricing.check.ts

export const toCents = (dollars: number): number => Math.round(dollars * 100);

/** "$45.00" for UI display. */
export const formatUSD = (dollars: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(dollars);

export interface PriceLine {
  unitPrice: number; // dollars, from the trusted source (Strapi)
  qty: number;
}

export interface Totals {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  subtotal: string; // PayPal "value" format, e.g. "90.00"
  shipping: string;
  total: string;
}

/**
 * Server-authoritative totals. `unitPrice` MUST come from Strapi, never from the client — the
 * checkout route looks each product up by slug and passes the stored price in here. Quantity is
 * clamped to a non-negative integer so a hostile payload can't produce negative/fractional charges.
 */
export function computeTotals(lines: PriceLine[], shippingDollars: number): Totals {
  const subtotalCents = lines.reduce(
    (sum, l) => sum + toCents(l.unitPrice) * Math.max(0, Math.trunc(l.qty)),
    0,
  );
  const shippingCents = toCents(shippingDollars);
  const totalCents = subtotalCents + shippingCents;
  const money = (c: number) => (c / 100).toFixed(2);
  return {
    subtotalCents,
    shippingCents,
    totalCents,
    subtotal: money(subtotalCents),
    shipping: money(shippingCents),
    total: money(totalCents),
  };
}
