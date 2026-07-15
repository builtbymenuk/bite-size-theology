"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useCart } from "@/lib/cart";
import { formatUSD } from "@/lib/pricing";
import Placeholder from "@/components/ui/Placeholder";
import { toneFor } from "@/components/store/tone";

export default function Checkout({
  shippingFee,
  currency,
  paypalEnabled,
  stripeEnabled,
}: {
  shippingFee: number;
  currency: string;
  paypalEnabled: boolean;
  stripeEnabled: boolean;
}) {
  const { items, subtotal, count, clear, keyOf } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const showPayPal = paypalEnabled && !!clientId;

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
  // Only slug/size/qty go to the server — it re-prices everything from Strapi.
  const payload = () => ({
    items: items.map((i) => ({ slug: i.slug, size: i.size, qty: i.qty })),
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
                {formatUSD(it.price * it.qty)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-ink/60">Subtotal</span>
          <span className="tabular-nums">{formatUSD(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Shipping</span>
          <span className="tabular-nums">
            {shippingFee === 0 ? "Free" : formatUSD(shippingFee)}
          </span>
        </div>
        <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-medium">
          <span>Total</span>
          <span className="tabular-nums">{formatUSD(total)}</span>
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

      {stripeEnabled || showPayPal ? (
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

          {showPayPal && (
            <PayPalScriptProvider options={{ clientId: clientId!, currency, intent: "capture" }}>
              <PayPalButtons
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
