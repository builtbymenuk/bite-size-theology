"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { StoreProduct } from "@/lib/content";

export default function AddToCart({ product }: { product: StoreProduct }) {
  const { add } = useCart();
  const [size, setSize] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState(false);
  const needsSize = product.sizes.length > 0;

  if (product.soldOut) {
    return (
      <p className="mt-8 inline-block rounded-full border border-ink/20 px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] text-ink/50">
        Sold Out
      </p>
    );
  }

  function handleAdd() {
    if (needsSize && !size) {
      setErr(true);
      return;
    }
    add({
      slug: product.slug,
      title: product.title,
      image: product.images[0],
      size,
      price: product.price,
      qty,
    });
  }

  return (
    <div className="mt-8">
      {needsSize && (
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink/50">
            Size{" "}
            {err && <span className="text-gold">— please select one</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSize(s);
                  setErr(false);
                }}
                aria-pressed={size === s}
                className={`min-w-11 rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                  size === s
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/20 text-ink hover:border-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center rounded-full border border-ink/20">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="px-3.5 py-2 text-ink/60 transition-colors hover:text-ink"
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm tabular-nums">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="px-3.5 py-2 text-ink/60 transition-colors hover:text-ink"
          >
            +
          </button>
        </div>
        <button
          onClick={handleAdd}
          className="flex-1 rounded-full bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
