"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface LastGift {
  amount?: number;
  currency?: string;
}

export default function DonateThankYou({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  const [gift, setGift] = useState<LastGift | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const params = useSearchParams();
  const ran = useRef(false);
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (sessionId) {
      // Returned from Stripe → finalize + record server-side.
      setFinalizing(true);
      fetch("/api/donate/stripe/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })
        .then((r) => r.json())
        .then((res) => res?.ok && setGift(res))
        .catch(() => {})
        .finally(() => setFinalizing(false));
      return;
    }
    // PayPal path stashed the result before routing here.
    try {
      const raw = sessionStorage.getItem("bst-last-donation");
      if (raw) setGift(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  const amountLabel =
    gift?.amount != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: gift.currency || "USD" }).format(gift.amount)
      : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 pb-24 pt-40 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-gold">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h1 className="mt-8 font-display text-4xl tracking-tight md:text-5xl">{heading}</h1>
      {finalizing ? (
        <p className="mt-4 text-sm text-ink/60">Finalizing your gift…</p>
      ) : amountLabel ? (
        <p className="mt-4 text-sm text-ink/60">
          Your gift of <span className="font-medium text-ink">{amountLabel}</span> has been received.
        </p>
      ) : null}
      <p className="mt-4 max-w-md whitespace-pre-line text-sm leading-relaxed text-ink/70">{body}</p>
      <Link
        href="/"
        className="mt-10 rounded-full bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal"
      >
        Back to home
      </Link>
    </div>
  );
}
