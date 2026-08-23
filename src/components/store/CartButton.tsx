"use client";

import { useCart } from "@/lib/cart";

// The shop's cart trigger — mounted by src/app/store/layout.tsx, not the navbar, so it exists only
// where there is something to buy. Pinned to the top-right corner: level with the nav pill on lg+
// (h-[3.625rem] is that pill's exact height, so top-4 shares its baseline), tucked just below it on
// narrower screens where the pill stretches out and its hamburger owns the corner.
export default function CartButton() {
  const { count, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={count ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart"}
      // Anchored across route transitions the same way the navbar is — see globals.css.
      style={{ viewTransitionName: "cart" }}
      // z-40: under the header and the mobile menu overlay (both z-50, so the menu covers this),
      // far under CartDrawer (z-[110]). Borrows the nav pill's surface so it stays legible over the
      // hero, the gold marquee and the cream catalog alike.
      className="fixed right-4 top-20 z-40 flex h-[3.625rem] w-[3.625rem] items-center justify-center rounded-full border border-ink/10 bg-cream/80 text-ink shadow-sm backdrop-blur-md transition-colors hover:bg-cream lg:top-4"
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
        <span className="absolute right-3 top-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-none text-ink">
          {count}
        </span>
      )}
    </button>
  );
}
