"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import NewsletterForm from "./NewsletterForm";
import type { Newsletter } from "@/lib/content";
import {
  markSeenThisSession,
  rememberDismissed,
  rememberSubscribed,
  seenThisSession,
  suppressed,
} from "@/lib/newsletter-local";

// A corner card, not a modal: no backdrop, no scroll lock, no focus trap, and it never takes the
// caret off someone mid-read. The page keeps working behind it, which is the whole reason this
// format doesn't get resented the way a full-screen interstitial does.
//
// Mounted once in the root layout next to CartDrawer — a position:fixed overlay has to sit outside
// the routed page, or template.tsx's view transition becomes its containing block (the same rule
// SeriesWall documents for its lightbox).
const EASE = [0.22, 1, 0.36, 1] as const;

export default function NewsletterPopup({ copy }: { copy: Newsletter }) {
  const pathname = usePathname();
  // The shop is the one flow we stay out of: CartBar is fixed to the bottom edge there on mobile,
  // and interrupting a checkout to ask for an email address is the wrong trade anyway.
  const onStore = pathname?.startsWith("/store") ?? false;

  const [eligible, setEligible] = useState(false); // cleared the storage + server gates
  const [timerDone, setTimerDone] = useState(false);
  const [closed, setClosed] = useState(false); // answered once — don't reopen on this mount

  // Derived, not stored. Every input is already state, so an `open` flag would just be a copy that
  // has to be kept in sync from several effects — and syncing it is what makes React warn about
  // cascading renders. Leaving the shop, for instance, brings the card back on its own.
  const open = eligible && timerDone && !closed && !onStore;

  const close = useCallback(() => {
    setClosed(true);
    rememberDismissed(); // 30 days — closing it is an answer, not a deferral
  }, []);

  // Gate 1: is there anything to ask this person? Cheapest checks first, so a subscriber never
  // pays for a round trip and never sees a flash before one resolves.
  useEffect(() => {
    if (!copy.popupEnabled || onStore) return;
    if (suppressed() || seenThisSession()) return;

    let cancelled = false;
    // The cross-device check: an httpOnly cookie this browser can't read for itself. Set when they
    // signed up here OR opened the confirmation email here — usually a second device. On failure
    // we fall through and show it; a down endpoint shouldn't silence a capture point.
    fetch("/api/newsletter/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => {
        if (cancelled) return;
        if (data?.subscribed) {
          rememberSubscribed(); // don't ask the server again on this browser
          return;
        }
        setEligible(true);
      });

    return () => {
      cancelled = true;
    };
  }, [copy.popupEnabled, onStore]);

  // Gate 2: the timer. Set in Strapi ("Popup — Delay"), clamped to 2–120s by getNewsletter().
  useEffect(() => {
    if (!eligible) return;
    const t = setTimeout(() => setTimerDone(true), copy.popupDelaySeconds * 1000);
    return () => clearTimeout(t);
  }, [eligible, copy.popupDelaySeconds]);

  // Once per tab, recorded the moment it actually appears — so a reload mid-session doesn't
  // restart the timer and show it twice in one sitting.
  useEffect(() => {
    if (open) markSeenThisSession();
  }, [open]);

  // Not modal, so Tab is free to leave — but a keyboard user still needs an exit that isn't
  // hunting for the close button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Signed up: leave the confirmation on screen long enough to read, then get out of the way.
  // NewsletterForm has already recorded it locally, so this never reopens.
  const onSuccess = useCallback(() => {
    setTimeout(() => setClosed(true), 2600);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          // A complementary landmark, so screen-reader users can navigate TO it instead of being
          // interrupted BY it. Deliberately not role="dialog": nothing here is modal.
          aria-label="Newsletter signup"
          className="fixed inset-x-3 bottom-3 z-[100] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-ink text-cream shadow-2xl ring-1 ring-cream/15">
            {/* The same 2px gold hairline ReadingProgress draws across the top of an article. */}
            <span className="absolute inset-x-0 top-0 h-[2px] bg-gold" aria-hidden />

            {/* Signature: the Aileron lockup from the hero and the footer, oversized and cropped by
                the parent's overflow-hidden. One fragment of the wordmark places this card as ours
                without spending room on a logo. Decorative — hidden from AT, unselectable. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -left-1 -top-6 select-none whitespace-nowrap font-lockup text-[3.5rem] font-black italic uppercase leading-none tracking-[-0.015em] text-cream/[0.05]"
            >
              Bite Size Theology
            </span>

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-2.5 z-10 text-2xl leading-none text-cream/40 transition-colors hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
            >
              ×
            </button>

            {/* env(safe-area-inset-bottom) resolves to 0 on desktop, so max() keeps the normal
                padding there and clears the iPhone home indicator on the bottom-sheet layout. */}
            <div className="relative px-6 pt-9 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-7">
              <NewsletterForm variant="popup" copy={copy} onSuccess={onSuccess} />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
