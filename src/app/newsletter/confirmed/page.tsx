// The landing spot for the link in the confirmation email — the route does the work and redirects
// here, so this page only ever reports an outcome.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Subscription Confirmed — Bite Size Theology",
  robots: { index: false }, // a one-off transactional page; nothing here to index
};

const OUTCOMES = {
  ok: {
    lead: "You're on",
    accent: "the list.",
    body: "One short study a week, straight to your inbox. Nothing else, and you can leave any time — every email carries an unsubscribe link.",
  },
  invalid: {
    lead: "That link has",
    accent: "expired.",
    body: "Confirmation links are replaced each time you sign up, and they stop working once you unsubscribe. Enter your address again and we'll send a fresh one.",
  },
  error: {
    lead: "Something went",
    accent: "wrong.",
    body: "We couldn't confirm your subscription just now. Please try the link again in a few minutes — if it still fails, get in touch and we'll sort it out.",
  },
} as const;

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const o = OUTCOMES[state === "invalid" ? "invalid" : state === "error" ? "error" : "ok"];

  return (
    <div className="min-h-screen bg-cream text-ink">
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-32">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Newsletter</p>
        <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-tight">
          {o.lead} <span className="italic text-gold">{o.accent}</span>
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink/60">{o.body}</p>
        <Link
          href="/"
          className="mt-10 inline-flex w-fit items-center gap-3 bg-ink px-8 py-4 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal"
        >
          Back to the site
        </Link>
      </main>
      <Footer />
    </div>
  );
}
