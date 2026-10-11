"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useLenis } from "lenis/react";
import type { Nav } from "@/lib/content";
import { useDialog } from "@/components/ui/useDialog";

// Fallback internal routes by label, used only when a nav item's CMS url is blank — so known
// pages keep working even if an editor clears the URL. Editors can override any of these (or point
// a label anywhere) via the "Shared — Navbar" links (label + url) in the admin.
// The brand mark, used as a mask rather than an image — see the note at the logo Link.
const BIRD = "url('/bst-bird.png')";

const HREFS: Record<string, string> = {
  About: "/about",
  "Sermons/Videos": "/podcast",
  Blog: "/blog",
  Shop: "/store",
  "Book Caleb": "/book-caleb",
  Contact: "/contact",
};

export default function Navbar({ nav }: { nav: Nav }) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  // The menu remembers the route it was opened on, so any navigation (a menu link, Back, a link
  // inside the page) closes it without an effect syncing state.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn !== null && openOn === pathname;
  const close = useCallback(() => setOpenOn(null), []);
  const menuRef = useRef<HTMLDivElement>(null);
  useDialog(open, close, menuRef);

  // Dark pages (e.g. /tour, no full-height hero) pin the light pill; home flips on scroll.
  // /blog is the cream index and pins light; /blog/[slug] deliberately does NOT — it opens on a
  // dark hero image, so it flips on scroll like the homepage.
  const fixedTheme: "light" | undefined =
    pathname === "/blog" ||
    pathname?.startsWith("/tour") ||
    pathname?.startsWith("/contact") ||
    pathname?.startsWith("/book-caleb") ||
    pathname?.startsWith("/prayer") ||
    pathname?.startsWith("/donate") ||
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
      // pointer-events-none: this box spans the full width and 74px of height but is transparent
      // outside the pill — without it, it swallows clicks aimed at anything beneath (e.g. the
      // shop's corner cart button). The pill and the mobile menu opt back in.
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4"
      style={{ viewTransitionName: "navbar" }}
    >
      <nav
        className={`pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-6 rounded-full border px-5 py-1 backdrop-blur-md lg:py-2.5 transition-colors duration-300 ${
          onDark
            ? "border-cream/15 bg-cream/10"
            : "border-ink/10 bg-cream/80 shadow-sm"
        }`}
      >
        {/* Theme class sits on the Link so the mark and the label share one colour decision. */}
        <Link
          href="/"
          className={`flex min-h-11 items-center gap-2.5 lg:min-h-0 ${onDark ? "text-cream" : "text-ink"}`}
        >
          {/* The bird PNG is solid white, and this pill turns cream once you scroll past the hero —
              an <img> would vanish there. Masking uses only the file's alpha channel, so the shape
              is painted in currentColor and flips with the theme. Same maskImage trick as
              SeriesWall's column fades, and it dodges next/image's SVG/PNG tint limits entirely. */}
          <span
            aria-hidden
            className="h-7 w-7 shrink-0 bg-current"
            style={{
              maskImage: BIRD,
              WebkitMaskImage: BIRD,
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />
          {/* Same face as the hero wordmark — one brand voice across the page. */}
          <span className="font-lockup whitespace-nowrap text-sm font-black italic uppercase tracking-[0.01em] sm:text-base">
            {nav.logo}
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {nav.links.map((l) => {
            const href = l.url || HREFS[l.label] || "#";
            const ext = /^https?:\/\//i.test(href);
            return (
              // Masked text-swap on hover: the label rolls up, a duplicate rolls in from below.
              <Link
                key={l.label}
                href={href}
                {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`group/ts relative block overflow-hidden text-[11px] font-medium uppercase tracking-[0.18em] ${
                  onDark ? "text-cream/80" : "text-ink/70"
                }`}
              >
                <span className="block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/ts:-translate-y-full">
                  {l.label}
                </span>
                <span
                  aria-hidden
                  className={`absolute inset-0 block translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/ts:translate-y-0 ${
                    onDark ? "text-cream" : "text-ink"
                  }`}
                >
                  {l.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/donate"
            className="hidden rounded-full bg-blue px-5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-blue/90 lg:inline-block"
          >
            {nav.cta}
          </Link>
          <button
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpenOn(pathname)}
            className={`-mr-2 flex h-11 w-11 items-center justify-center lg:hidden ${
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
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Above the newsletter popup (z-[100]); scrolls on its own in landscape; insets clear
            // the notch and home indicator.
            className="pointer-events-auto fixed inset-0 z-[105] flex flex-col overflow-y-auto overscroll-contain bg-charcoal px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-cream lg:hidden"
          >
            <div className="flex justify-end">
              <button
                aria-label="Close menu"
                onClick={close}
                className="-mr-2 flex h-11 w-11 items-center justify-center text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mt-4 flex flex-col">
              {nav.links.map((l) => {
                const href = l.url || HREFS[l.label] || "#";
                const ext = /^https?:\/\//i.test(href);
                return (
                  <Link
                    key={l.label}
                    href={href}
                    {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    onClick={close}
                    className="py-2.5 font-display text-3xl"
                  >
                    {l.label}
                  </Link>
                );
              })}
              <Link
                href="/donate"
                onClick={close}
                className="mt-8 inline-block w-fit rounded-full bg-blue px-7 py-4 text-xs uppercase tracking-widest text-white"
              >
                {nav.cta}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
