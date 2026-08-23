"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "@/lib/cart";
import { formatUSD } from "@/lib/pricing";

// The shop's cart control below lg, where CartButton's top-right pill sat over the product grid and
// out of thumb reach. Empty cart → a bag button in the bottom corner; anything in it → a bar with
// the running total, tap-left to review in the drawer, tap-right to check out.
const EASE = [0.22, 1, 0.36, 1] as const;

function Bag() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8h12l-1 12H7L6 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V6a3 3 0 0 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CartBar() {
  const { count, subtotal, openCart } = useCart();
  const pathname = usePathname();

  // Checkout already lists the cart and has its own pay button.
  if (pathname?.startsWith("/store/checkout")) return null;

  return (
    // The wrapper is the view-transition anchor (see globals.css) and always renders, so the two
    // states share one name. pointer-events-none: it spans the full width but is transparent
    // outside its controls — the same trap the navbar <header> fell into.
    <div
      style={{ viewTransitionName: "cartbar" }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden"
    >
      <AnimatePresence initial={false}>
        {count > 0 ? (
          <motion.div
            key="bar"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "tween", duration: 0.35, ease: EASE }}
            // pb clears the home indicator on notched phones, falling back to 0.75rem elsewhere.
            className="pointer-events-auto flex items-center gap-3 border-t border-ink/10 bg-cream/95 px-4 pt-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <button
              type="button"
              onClick={openCart}
              className="flex flex-1 items-center gap-2 py-2 text-left text-ink"
            >
              <Bag />
              <span className="text-[11px] uppercase tracking-[0.18em] text-ink/60">
                {count} item{count === 1 ? "" : "s"}
                <span className="mx-1.5 text-ink/30">·</span>
                <span className="font-medium text-ink tabular-nums">
                  {formatUSD(subtotal)}
                </span>
              </span>
            </button>
            <Link
              href="/store/checkout"
              className="shrink-0 rounded-full bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal"
            >
              Checkout
            </Link>
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            type="button"
            onClick={openCart}
            aria-label="Open cart"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mb-5 ml-auto mr-4 flex h-14 w-14 items-center justify-center rounded-full border border-ink/10 bg-cream/90 text-ink shadow-lg backdrop-blur-md"
          >
            <Bag />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
