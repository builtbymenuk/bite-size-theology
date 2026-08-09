"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useLenis } from "lenis/react";
import type { Nav } from "@/lib/content";
import CartButton from "@/components/store/CartButton";

// Links to routes that actually exist; every other label (e.g. "Book Caleb") stays a placeholder
// anchor for now. "Sermons/Videos" is the podcast page.
const HREFS: Record<string, string> = {
  About: "/about",
  "Sermons/Videos": "/podcast",
  Shop: "/store",
  "Book Caleb": "/book-caleb",
  Contact: "/contact",
};

export default function Navbar({ nav }: { nav: Nav }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Dark pages (e.g. /tour, no full-height hero) pin the light pill; home flips on scroll.
  const fixedTheme: "light" | undefined =
    pathname?.startsWith("/tour") ||
    pathname?.startsWith("/contact") ||
    pathname?.startsWith("/book-caleb") ||
    pathname?.startsWith("/prayer") ||
    pathname?.startsWith("/about") ||
    pathname?.startsWith("/podcast") ||
    pathname?.startsWith("/store")
      ? "light"
      : undefined;

  // Nav sits over the dark hero, then flips to a cream bar once past it so it stays readable.
  useLenis(({ scroll }: { scroll: number }) => {
    if (fixedTheme) return;
    setScrolled(scroll > window.innerHeight - 90);
  });

  // "light" = solid cream pill / dark text; otherwise frosted pill over the hero, flipping on scroll.
  const onDark = fixedTheme ? false : !scrolled;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
      style={{ viewTransitionName: "navbar" }}
    >
      <nav
        className={`mx-auto flex max-w-5xl items-center justify-between gap-6 rounded-full border px-5 py-2.5 backdrop-blur-md transition-colors duration-300 ${
          onDark
            ? "border-cream/15 bg-cream/10"
            : "border-ink/10 bg-cream/80 shadow-sm"
        }`}
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-gold" />
          <span
            className={`font-display text-sm ${onDark ? "text-cream" : "text-ink"}`}
          >
            {nav.logo}
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {nav.links.map((l) => (
            // Masked text-swap on hover: the label rolls up, a duplicate rolls in from below.
            <Link
              key={l}
              href={HREFS[l] ?? "#"}
              className={`group/ts relative block overflow-hidden text-[11px] font-medium uppercase tracking-[0.18em] ${
                onDark ? "text-cream/80" : "text-ink/70"
              }`}
            >
              <span className="block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/ts:-translate-y-full">
                {l}
              </span>
              <span
                aria-hidden
                className={`absolute inset-0 block translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/ts:translate-y-0 ${
                  onDark ? "text-cream" : "text-ink"
                }`}
              >
                {l}
              </span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <CartButton dark={onDark} />
          <a
            href="#"
            className="hidden rounded-full bg-blue px-5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-blue/90 md:inline-block"
          >
            {nav.cta}
          </a>
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className={`flex h-9 w-9 items-center justify-center md:hidden ${
              onDark ? "text-cream" : "text-ink"
            }`}
          >
            <span className="sr-only">Menu</span>
            <div className="space-y-1.5">
              <span className="block h-px w-6 bg-current" />
              <span className="block h-px w-6 bg-current" />
            </div>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-charcoal px-6 py-6 text-cream md:hidden"
          >
            <div className="flex justify-end">
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mt-8 flex flex-col gap-6">
              {nav.links.map((l) => (
                <Link
                  key={l}
                  href={HREFS[l] ?? "#"}
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl"
                >
                  {l}
                </Link>
              ))}
              <a
                href="#"
                onClick={() => setOpen(false)}
                className="mt-4 inline-block w-fit rounded-full bg-blue px-6 py-3 text-xs uppercase tracking-widest text-white"
              >
                {nav.cta}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
