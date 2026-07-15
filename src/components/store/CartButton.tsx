"use client";

import { useCart } from "@/lib/cart";

// Nav cart trigger. `dark` matches the Navbar's onDark styling so it reads on the hero + cream bar.
export default function CartButton({ dark }: { dark?: boolean }) {
  const { count, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={count ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart"}
      className={`relative flex h-9 w-9 items-center justify-center transition-colors ${
        dark ? "text-cream" : "text-ink"
      }`}
    >
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
      {count > 0 && (
        <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-none text-ink">
          {count}
        </span>
      )}
    </button>
  );
}
