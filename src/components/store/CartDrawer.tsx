"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useCart } from "@/lib/cart";
import { formatUSD } from "@/lib/pricing";
import Placeholder from "@/components/ui/Placeholder";
import { toneFor } from "@/components/store/tone";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, setQty, remove, keyOf, count } =
    useCart();
  const lenis = useLenis();
  const panelRef = useRef<HTMLElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // While open: stop the (Lenis-driven) background scroll, focus into the panel, trap Tab, Esc closes.
  useEffect(() => {
    if (!isOpen) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    lenis?.stop();

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lenis?.start();
      restoreRef.current?.focus?.();
    };
  }, [isOpen, closeCart, lenis]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[110]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={closeCart}
            aria-hidden
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: EASE }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream text-ink shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <h2 className="font-display text-lg uppercase tracking-wide">
                Cart{" "}
                {count > 0 && <span className="text-ink/40">({count})</span>}
              </h2>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="text-2xl leading-none text-ink/50 transition-colors hover:text-ink"
              >
                ×
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-sm text-ink/50">Your cart is empty.</p>
                <button
                  onClick={closeCart}
                  className="text-[11px] uppercase tracking-[0.22em] text-ink underline underline-offset-4"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto overscroll-contain px-6">
                  {items.map((it) => {
                    const k = keyOf(it);
                    return (
                      <li key={k} className="flex gap-4 py-5">
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg">
                          <Placeholder tone={toneFor(it.slug)} src={it.image} label="" />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between gap-2">
                            <p className="text-sm font-medium leading-snug">
                              {it.title}
                            </p>
                            <button
                              onClick={() => remove(k)}
                              aria-label={`Remove ${it.title}`}
                              className="shrink-0 text-ink/40 transition-colors hover:text-ink"
                            >
                              ×
                            </button>
                          </div>
                          {it.size && (
                            <p className="mt-0.5 text-xs text-ink/50">
                              Size: {it.size}
                            </p>
                          )}
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center rounded-full border border-ink/15">
                              <button
                                onClick={() => setQty(k, it.qty - 1)}
                                aria-label="Decrease quantity"
                                className="px-2.5 py-1 text-ink/60 transition-colors hover:text-ink"
                              >
                                −
                              </button>
                              <span className="min-w-6 text-center text-xs tabular-nums">
                                {it.qty}
                              </span>
                              <button
                                onClick={() => setQty(k, it.qty + 1)}
                                aria-label="Increase quantity"
                                className="px-2.5 py-1 text-ink/60 transition-colors hover:text-ink"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-sm tabular-nums">
                              {formatUSD(it.price * it.qty)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <footer className="border-t border-ink/10 px-6 py-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink/60">Subtotal</span>
                    <span className="font-medium tabular-nums">
                      {formatUSD(subtotal)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink/40">
                    Shipping calculated at checkout.
                  </p>
                  <Link
                    href="/store/checkout"
                    onClick={closeCart}
                    className="mt-4 flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal"
                  >
                    Checkout
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
