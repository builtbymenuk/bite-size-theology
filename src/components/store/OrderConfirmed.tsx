"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart";

interface LastOrder {
  orderNumber?: string;
  email?: string;
  total?: number;
  currency?: string;
}

export default function OrderConfirmed() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const params = useSearchParams();
  const { clear } = useCart();
  const ran = useRef(false); // StrictMode double-invoke guard

  const sessionId = params.get("session_id");
  const isStripe = params.get("provider") === "stripe" && !!sessionId;

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (isStripe) {
      // Returned from Stripe's hosted page → finalize the order server-side, then clear the cart.
      setFinalizing(true);
      fetch("/api/store/stripe/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })
        .then((r) => r.json())
        .then((result) => {
          if (result?.ok) {
            setOrder(result);
            clear();
          }
        })
        .catch(() => {
          /* leave the generic thank-you fallback */
        })
        .finally(() => {
          setFinalizing(false);
          setLoaded(true);
        });
      return;
    }

    // PayPal path: the capture step stashed the summary before routing here.
    try {
      const raw = sessionStorage.getItem("bst-last-order");
      if (raw) setOrder(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [isStripe, sessionId, clear]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 pb-24 pt-40 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-gold">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12l5 5L20 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h1 className="mt-8 font-display text-4xl tracking-tight md:text-5xl">
        Thank you
      </h1>
      {finalizing ? (
        <p className="mt-4 text-sm text-ink/60">Finalizing your order…</p>
      ) : loaded && order?.orderNumber ? (
        <p className="mt-4 text-sm text-ink/60">
          Your order{" "}
          <span className="font-medium text-ink">{order.orderNumber}</span> is
          confirmed.
          {order.email ? <> A receipt is on its way to {order.email}.</> : null}
        </p>
      ) : (
        <p className="mt-4 text-sm text-ink/60">
          Your order is confirmed. Thank you for supporting the mission.
        </p>
      )}
      <p className="mt-2 text-xs text-ink/40">
        10% of your purchase supports mission work.
      </p>
      <Link
        href="/store"
        className="mt-10 rounded-full bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal"
      >
        Continue shopping
      </Link>
    </div>
  );
}
