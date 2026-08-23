// Presentment currencies for the store checkout. Products are priced in the store's base currency
// (USD, from Strapi); the buyer picks a display/charge currency on our checkout page and the server
// converts at daily FX rates before handing amounts to Stripe or PayPal.
//
// Stripe's own "Choose currency" widget is Adaptive Pricing — it only ever offers the buyer's local
// currency plus ours and takes no list, which is why the choice is made on our page instead.
//
// Runnable check: node --experimental-strip-types src/lib/currency.check.ts

export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

// The offer list. Every code here must exist in FALLBACK_RATES.
export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "NZD", label: "New Zealand Dollar", symbol: "NZ$" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
];

// PayPal rejects an order in a currency the account can't hold — INR is receive-restricted, so the
// PayPal button hides for it and card checkout carries those buyers.
export const PAYPAL_CURRENCIES = new Set([
  "USD", "GBP", "EUR", "CAD", "AUD", "NZD", "JPY", "SGD",
]);

// Zero-decimal currencies are charged in whole units — Stripe wants 1200 for ¥1,200, not 120000,
// and PayPal rejects "1200.00". Only JPY is in our list; add the rest of Stripe's zero-decimal set
// here if the list ever grows (KRW, VND, CLP, …).
const ZERO_DECIMAL = new Set(["JPY"]);

export const decimalsFor = (code: string): number =>
  ZERO_DECIMAL.has(code.toUpperCase()) ? 0 : 2;

export const isSupported = (code: unknown): boolean =>
  typeof code === "string" && CURRENCIES.some((c) => c.code === code.toUpperCase());

/** Units of `code` per 1 USD. Backstop only — getRates() overlays live values on top. */
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  GBP: 0.78,
  EUR: 0.92,
  CAD: 1.37,
  AUD: 1.52,
  NZD: 1.66,
  JPY: 152,
  SGD: 1.34,
  INR: 84,
};

/** Convert a base-currency (USD) amount and round to the target currency's precision. */
export const convert = (amount: number, rate: number, code: string): number => {
  const unit = 10 ** decimalsFor(code);
  return Math.round(amount * rate * unit) / unit;
};

/**
 * Daily FX rates keyed by currency code, per 1 USD. Free keyless endpoint; Next's fetch cache holds
 * the response for a day, so this is one live call per day per server. Any failure (offline, bad
 * shape, missing code) falls through to FALLBACK_RATES — checkout must never break on FX.
 *
 * ponytail: fixed base of USD, matching the store's base currency. If the store's base ever becomes
 * configurable, request that base instead of dividing rates here.
 */
export async function getRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`rates ${res.status}`);
    const live = (await res.json())?.rates;
    if (!live || typeof live !== "object") throw new Error("rates: bad shape");

    const out = { ...FALLBACK_RATES };
    for (const { code } of CURRENCIES) {
      const r = Number(live[code]);
      if (Number.isFinite(r) && r > 0) out[code] = r;
    }
    return out;
  } catch (e) {
    console.warn("getRates: falling back to static table —", e);
    return { ...FALLBACK_RATES };
  }
}
