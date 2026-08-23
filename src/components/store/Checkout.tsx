"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useCart } from "@/lib/cart";
import { formatUSD } from "@/lib/pricing";
import { CURRENCIES, PAYPAL_CURRENCIES, convert } from "@/lib/currency";
import Placeholder from "@/components/ui/Placeholder";
import { toneFor } from "@/components/store/tone";

export default function Checkout({
  shippingFee,
  currency,
  rates,
  paypalEnabled,
  stripeEnabled,
}: {
  shippingFee: number;
  currency: string;
  rates: Record<string, number>;
  paypalEnabled: boolean;
  stripeEnabled: boolean;
}) {
  const { items, subtotal, count, clear, keyOf } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [cur, setCur] = useState(currency.toUpperCase());
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  // PayPal can't take every currency we offer (INR), so the button hides rather than failing at
  // click time; card checkout covers those buyers.
  const payPalReady = paypalEnabled && !!clientId;
  const showPayPal = payPalReady && PAYPAL_CURRENCIES.has(cur);

  if (count === 0) {
    return (
      <div className="mt-10">
        <p className="text-sm text-ink/60">Your cart is empty.</p>
        <Link
          href="/store"
          className="mt-4 inline-block text-[11px] uppercase tracking-[0.22em] underline underline-offset-4"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const total = subtotal + shippingFee;
  // Display-only conversion. The server re-converts from the same daily rates when it prices the
  // cart, so what Stripe/PayPal charge never depends on these numbers.
  const rate = rates[cur] ?? 1;
  const fmt = (usd: number) => formatUSD(convert(usd, rate, cur), cur);
  // Only slug/size/qty go to the server — it re-prices everything from Strapi. `currency` is a
  // request, not an instruction: the route validates it against the offer list.
  const payload = () => ({
    items: items.map((i) => ({ slug: i.slug, size: i.size, qty: i.qty })),
    currency: cur,
  });

  return (
    <div className="mt-10 grid gap-10">
      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {items.map((it) => (
          <li key={keyOf(it)} className="flex gap-4 py-5">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg">
              <Placeholder tone={toneFor(it.slug)} src={it.image} label="" />
            </div>
            <div className="flex flex-1 justify-between gap-4">
              <div>
                <p className="text-sm font-medium leading-snug">{it.title}</p>
                {it.size && (
                  <p className="mt-0.5 text-xs text-ink/50">Size: {it.size}</p>
                )}
                <p className="text-xs text-ink/50">Qty: {it.qty}</p>
              </div>
              <span className="text-sm tabular-nums">
                {fmt(it.price * it.qty)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div>
        <label
          htmlFor="currency"
          className="text-[11px] uppercase tracking-[0.22em] text-ink/50"
        >
          Pay in
        </label>
        <select
          id="currency"
          value={cur}
          onChange={(e) => setCur(e.target.value)}
          className="mt-2 w-full rounded-full border border-ink/15 bg-transparent px-5 py-3 text-sm focus:border-ink/40 focus:outline-none"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.label}
            </option>
          ))}
        </select>
        {cur !== currency.toUpperCase() && (
          <p className="mt-2 text-xs text-ink/50">
            Converted from {currency.toUpperCase()} at today’s rate. Your bank may apply its own
            fees.
          </p>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-ink/60">Subtotal</span>
          <span className="tabular-nums">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Shipping</span>
          <span className="tabular-nums">
            {shippingFee === 0 ? "Free" : fmt(shippingFee)}
          </span>
        </div>
        <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-medium">
          <span>Total</span>
          <span className="tabular-nums">{fmt(total)}</span>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-gold/15 px-4 py-3 text-sm text-ink"
        >
          {error}
        </p>
      )}

      {stripeEnabled || payPalReady ? (
        <div className="grid gap-5">
          {stripeEnabled && (
            <button
              type="button"
              disabled={redirecting}
              onClick={async () => {
                setError(null);
                setRedirecting(true);
                try {
                  const res = await fetch("/api/store/stripe/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload()),
                  });
                  const data = await res.json();
                  if (!res.ok || !data?.url) {
                    setError(data?.error ?? "Could not start checkout.");
                    setRedirecting(false);
                    return;
                  }
                  // Hosted Checkout: leave for Stripe. Cart is kept until the order is confirmed on return.
                  window.location.href = data.url;
                } catch {
                  setError("Could not start checkout. Please try again.");
                  setRedirecting(false);
                }
              }}
              className="flex w-full items-center justify-center rounded-full bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal disabled:opacity-60"
            >
              {redirecting ? "Redirecting…" : "Pay with card"}
            </button>
          )}

          {stripeEnabled && showPayPal && (
            <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.22em] text-ink/40">
              <span className="h-px flex-1 bg-ink/10" />
              or
              <span className="h-px flex-1 bg-ink/10" />
            </div>
          )}

          {payPalReady && !showPayPal && (
            <p className="text-center text-xs text-ink/50">
              PayPal isn’t available in {cur} — pay by card, or switch to a currency PayPal
              supports.
            </p>
          )}

          {showPayPal && (
            <PayPalScriptProvider
              key={cur}
              options={{ clientId: clientId!, currency: cur, intent: "capture" }}
            >
              <PayPalButtons
                forceReRender={[cur]}
                style={{ layout: "vertical", shape: "pill", color: "gold", label: "paypal" }}
                createOrder={async () => {
                  setError(null);
                  const res = await fetch("/api/store/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload()),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setError(data?.error ?? "Could not start checkout.");
                    throw new Error(data?.error ?? "create failed");
                  }
                  return data.id;
                }}
                onApprove={async (data) => {
                  const res = await fetch("/api/store/capture", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderID: data.orderID, ...payload() }),
                  });
                  const result = await res.json();
                  if (!res.ok || !result.ok) {
                    setError(result?.error ?? "Payment could not be completed.");
                    return;
                  }
                  try {
                    sessionStorage.setItem("bst-last-order", JSON.stringify(result));
                  } catch {
                    /* non-fatal */
                  }
                  clear();
                  router.push("/store/order-confirmed");
                }}
                onError={() =>
                  setError("Something went wrong with PayPal. Please try again.")
                }
              />
            </PayPalScriptProvider>
          )}
        </div>
      ) : (
        <p className="rounded-lg border border-ink/15 px-4 py-3 text-sm text-ink/60">
          Checkout isn’t configured yet. Set{" "}
          <code className="text-ink">STRIPE_SECRET_KEY</code> and/or{" "}
          <code className="text-ink">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> to enable
          payments.
        </p>
      )}

      <Link
        href="/store"
        className="text-center text-[11px] uppercase tracking-[0.22em] text-ink/50 underline underline-offset-4"
      >
        Continue shopping
      </Link>
    </div>
  );
}
