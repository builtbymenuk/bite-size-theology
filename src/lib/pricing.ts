// Money math for the store. Amounts are computed in INTEGER CENTS to avoid float drift
// (0.1 + 0.2 !== 0.3), then formatted to PayPal's 2-decimal "value" strings on the way out.
// Runnable check: node --experimental-strip-types src/lib/pricing.check.ts

export const toCents = (dollars: number): number => Math.round(dollars * 100);

/** Smallest-unit amount for a currency with `decimals` places — cents for USD, whole yen for JPY. */
export const toMinor = (amount: number, decimals: number): number =>
  Math.round(amount * 10 ** decimals);

/** "$45.00" for UI display. */
export const formatUSD = (dollars: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(dollars);

export interface PriceLine {
  unitPrice: number; // dollars, from the trusted source (Strapi)
  qty: number;
}

export interface Totals {
  subtotalCents: number; // smallest units of the target currency (cents for USD, yen for JPY)
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
 *
 * `decimals` is the target currency's precision (0 for zero-decimal currencies like JPY). Default 2
 * keeps every USD caller unchanged. Amounts are still integer-minor-unit throughout.
 */
export function computeTotals(
  lines: PriceLine[],
  shippingDollars: number,
  decimals = 2,
): Totals {
  const subtotalCents = lines.reduce(
    (sum, l) => sum + toMinor(l.unitPrice, decimals) * Math.max(0, Math.trunc(l.qty)),
    0,
  );
  const shippingCents = toMinor(shippingDollars, decimals);
  const totalCents = subtotalCents + shippingCents;
  const money = (c: number) => (c / 10 ** decimals).toFixed(decimals);
  return {
    subtotalCents,
    shippingCents,
    totalCents,
    subtotal: money(subtotalCents),
    shipping: money(shippingCents),
    total: money(totalCents),
  };
}
