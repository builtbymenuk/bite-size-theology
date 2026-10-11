"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useLenis } from "lenis/react";

const FOCUSABLE =
  'a[href],button:not([disabled]),iframe,input,select,textarea,[tabindex]:not([tabindex="-1"])';

// The modal contract shared by CartDrawer, the SeriesWall lightbox and the mobile menu: while open,
// stop the background scroll (lenis.stop() adds .lenis-stopped → overflow:hidden on <html>, which
// also holds native touch scroll), focus into the panel, trap Tab, Esc closes, and hand focus back
// to whatever opened it.
export function useDialog(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
) {
  const lenis = useLenis();
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    lenis?.stop();

    const focusables = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    // Skip iframes for the initial focus: a cross-origin player swallows keydown, so Esc would
    // never reach this listener until the visitor clicked out of the video.
    focusables().find((el) => el.tagName !== "IFRAME")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
  }, [open, onClose, lenis, panelRef]);
}
