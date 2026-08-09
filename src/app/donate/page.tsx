// Render per-request: CMS copy shows on reload; also gates giving on live payment config.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Reveal, { RevealItem } from "@/components/ui/Reveal";
import DonateForm from "@/components/donate/DonateForm";
import { getDonate } from "@/lib/cms";
import { paypalConfigured } from "@/lib/paypal";
import { stripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Give — Bite Size Theology",
  description:
    "Partner with the mission. Your gift fuels honest conversations about faith on the streets, online, and around the world.",
};

// Minimal inline icons (no icon lib) — matches PodcastStats.
function Icon({ name }: { name: "mic" | "globe" | "award" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "globe")
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
      </svg>
    );
  if (name === "award")
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
        <circle cx="12" cy="9" r="6" />
        <path d="M9 14l-2 7 5-3 5 3-2-7" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
    </svg>
  );
}

export default async function DonatePage() {
  const donate = await getDonate();
  const paypalEnabled = paypalConfigured();
  const stripeEnabled = stripeConfigured();

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Hero + giving form */}
      <section className="mx-auto max-w-7xl px-6 pt-28 md:pt-36">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_0.9fr]">
          <Reveal className="lg:pt-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{donate.heroEyebrow}</p>
            <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98] tracking-tight">
              {donate.heroHeading}{" "}
              <span className="italic text-gold">{donate.heroAccent}</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/60">
              {donate.heroSubtext}
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs text-ink/50">
              {/* lock */}
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                <rect x="3" y="7" width="10" height="6.5" rx="1.5" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
              Secure giving via Stripe &amp; PayPal
            </div>
          </Reveal>

          <Reveal>
            <DonateForm
              presets={donate.presets}
              fundOptions={donate.fundOptions}
              currency="USD"
              paypalEnabled={paypalEnabled}
              stripeEnabled={stripeEnabled}
            />
          </Reveal>
        </div>
      </section>

      {/* Impact band */}
      <section className="mt-24 bg-charcoal text-cream md:mt-32">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <h2 className="text-center font-display text-3xl md:text-4xl">{donate.impactHeading}</h2>
          <Reveal stagger className="mt-12 grid gap-10 sm:grid-cols-3">
            {donate.impactStats.map((s) => (
              <RevealItem key={s.label} className="flex flex-col items-center text-center">
                <span className="text-gold">
                  <Icon name={s.icon} />
                </span>
                <span className="mt-4 font-display text-4xl md:text-5xl">{s.value}</span>
                <span className="mt-2 text-[11px] uppercase tracking-[0.25em] text-cream/60">
                  {s.label}
                </span>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Proceeds strip */}
      <div className="border-y border-ink/10 bg-[#e6ecf4]">
        <p className="mx-auto max-w-7xl px-6 py-4 text-center text-[11px] uppercase tracking-[0.25em] text-ink/60">
          {donate.proceedsNote}
        </p>
      </div>

      {/* Assurance + funds */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl">{donate.assuranceTitle}</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/60">{donate.assuranceBody}</p>
          </Reveal>
          {donate.fundOptions.length > 0 && (
            <Reveal stagger className="flex flex-col gap-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-ink/40">You can give toward</p>
              {donate.fundOptions.map((f) => (
                <RevealItem
                  key={f}
                  className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-4 text-sm text-ink"
                >
                  <span className="h-2 w-2 rounded-full bg-gold" />
                  {f}
                </RevealItem>
              ))}
            </Reveal>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
