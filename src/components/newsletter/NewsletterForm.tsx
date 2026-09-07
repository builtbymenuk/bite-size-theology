"use client";

import { useId, useState } from "react";
import type { Newsletter } from "@/lib/content";
import { rememberSubscribed } from "@/lib/newsletter-local";

// The one signup form, worn two ways. `variant` swaps nothing but a couple of classes — the
// request, the validation, the states and the accessibility wiring are shared, so the footer and
// the popup can never drift apart.
type Variant = "footer" | "popup";

// idle → sending → one of: pending (confirmation email sent), duplicate (already confirmed), error.
type State = "idle" | "sending" | "pending" | "duplicate" | "error";

interface Props {
  variant: Variant;
  copy: Newsletter;
  onSuccess?: () => void;
}

// Deliberately the same treatment as the footer's link-column titles, so the signup reads as one
// more column in that row rather than a promo bolted onto it.
const EYEBROW = "text-[11px] uppercase tracking-[0.25em] text-gold";

// Boxed rather than the site's underline-only `field` convention (ContactForm.tsx:7): a lone
// underline on the dark charcoal band reads as unfinished, and the box gives the tap target an
// edge on mobile.
const FIELD =
  "w-full rounded-lg border border-cream/20 bg-cream/[0.04] px-4 py-3.5 text-sm text-cream placeholder:text-cream/35 outline-none transition-colors focus:border-cream/50 focus:bg-cream/[0.07] disabled:opacity-60";

const PILL =
  "mt-4 rounded-full bg-gold px-8 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-ink transition-colors hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream disabled:cursor-not-allowed disabled:opacity-60";

// Both capture points sit on charcoal, so the surface is shared and only two things differ: how
// loud the heading is, and whether the pill fills its container.
const skin: Record<Variant, { heading: string; button: string }> = {
  footer: { heading: "mt-4 font-display text-2xl leading-snug", button: `${PILL} inline-block` },
  popup: { heading: "mt-3 font-display text-xl leading-snug", button: `${PILL} block w-full` },
};

export default function NewsletterForm({ variant, copy, onSuccess }: Props) {
  const uid = useId();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const s = skin[variant];
  const sending = state === "sending";
  const done = state === "pending" || state === "duplicate";
  const inputId = `nl-${uid}`;
  const errorId = `nl-err-${uid}`;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    setError("");
    const payload = {
      ...Object.fromEntries(new FormData(e.currentTarget).entries()),
      source: variant,
    };
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Something went wrong. Please try again.");
      // Both outcomes mean "stop asking this person": pending because they just signed up,
      // duplicate because they already had.
      rememberSubscribed();
      setState(data?.state === "duplicate" ? "duplicate" : "pending");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  };

  return (
    <div>
      <p className={EYEBROW}>{copy.eyebrow}</p>

      {!done && (
        <>
          <p className={s.heading}>{variant === "popup" ? copy.popupHeading : copy.heading}</p>
          {/* The footer's heading is the whole pitch — only the popup, which has to earn its
              interruption, carries a second line of body copy. */}
          {variant === "popup" && (
            <p className="mt-3 text-sm leading-relaxed text-cream/60">{copy.popupBody}</p>
          )}

          <form onSubmit={onSubmit} className="mt-5">
            {/* honeypot — real users never see or fill this; bots do. No captcha yet. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            <label htmlFor={inputId} className="sr-only">
              Email address
            </label>
            <input
              id={inputId}
              type="email"
              name="email"
              required
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              placeholder={copy.placeholder}
              disabled={sending}
              aria-invalid={state === "error" || undefined}
              aria-describedby={state === "error" ? errorId : undefined}
              className={FIELD}
            />

            <button type="submit" disabled={sending} aria-busy={sending} className={s.button}>
              {sending ? "Sending…" : copy.buttonLabel}
            </button>
          </form>
        </>
      )}

      {/* Rendered from the first paint, empty, so the swap to a success message is actually
          announced — a live region that appears at the same moment as its content often isn't. */}
      <p aria-live="polite" className={done ? "mt-4 text-sm leading-relaxed text-cream/80" : "sr-only"}>
        {state === "duplicate" ? copy.alreadySubscribedText : state === "pending" ? copy.successText : ""}
      </p>

      {state === "error" && (
        <p id={errorId} role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!done && <p className="mt-4 text-xs leading-relaxed text-cream/40">{copy.note}</p>}
    </div>
  );
}
