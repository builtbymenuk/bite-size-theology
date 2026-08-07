// Render per-request against live Strapi (CMS edits show on reload; also avoids baking
// fallback content when Strapi is unreachable at build time).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/ui/Reveal";
import MaskReveal from "@/components/ui/MaskReveal";
import Parallax from "@/components/ui/Parallax";
import Placeholder from "@/components/ui/Placeholder";
import ArrowButton from "@/components/ui/ArrowButton";
import { getAbout } from "@/lib/cms";

export const metadata: Metadata = {
  title: "About — Bite Size Theology",
  description:
    "Meet Caleb Griffith — his story, his mission, his turning point.",
};

export default async function AboutPage() {
  const about = await getAbout();
  return (
    // Cream wrapper covers the shared PageBackground; navbar pins its light pill on /about.
    <div className="min-h-screen bg-cream text-ink">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-28 md:pt-32">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
            {about.eyebrow}
          </p>
        </Reveal>

        <div className="mt-6 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <MaskReveal>
            <h1 className="font-display text-7xl leading-[0.9] tracking-tight md:text-8xl">
              {about.headingLead}{" "}
              <span className="font-semibold italic">{about.headingName}</span>
            </h1>
          </MaskReveal>

          <Reveal className="flex items-center gap-6 md:pb-3">
            <div>
              <p className="text-sm font-medium text-ink">{about.name}</p>
              <p className="text-[11px] text-ink/50">{about.role}</p>
            </div>
            <ArrowButton label={about.donateCta} />
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <Parallax
            className="grain relative aspect-[16/9] w-full overflow-hidden rounded-[2.5rem]"
            amount={14}
          >
            <Placeholder tone={about.images.hero.tone} label={about.images.hero.label} src={about.images.hero.src} />
          </Parallax>
        </Reveal>
      </section>

      {/* Intro lead */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal>
          <p className="max-w-3xl text-3xl font-medium leading-snug text-ink/80 md:text-4xl">
            {about.intro}
          </p>
        </Reveal>

        {/* The turn */}
        <Reveal className="mt-20 grid gap-10 md:grid-cols-[0.5fr_1fr] md:items-start">
          <h2 className="font-display text-5xl font-semibold italic text-gold md:text-6xl">
            {about.turnLead}
          </h2>
          <p className="max-w-xl font-display text-lg italic leading-relaxed text-ink/70">
            {about.story[0]}
          </p>
        </Reveal>

        {/* Cinematic beat — the encounter */}
        <Reveal className="mt-20">
          <Parallax
            className="grain relative aspect-[21/9] w-full overflow-hidden rounded-[2.5rem]"
            amount={16}
          >
            <Placeholder tone={about.images.turn.tone} label={about.images.turn.label} src={about.images.turn.src} />
          </Parallax>
        </Reveal>
      </section>

      {/* Pull-quote card */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
        <Reveal>
          <figure className="grain relative overflow-hidden rounded-[2.5rem] bg-gold p-12 text-cream md:p-16">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-6 right-6 font-display text-[12rem] leading-none text-cream/20"
            >
              &rdquo;
            </span>
            <blockquote className="relative max-w-2xl font-display text-3xl italic leading-snug md:text-4xl">
              &ldquo;{about.quote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-10 text-[11px] uppercase tracking-[0.25em] text-cream/80">
              &mdash; {about.quote.attribution}
            </figcaption>
          </figure>
        </Reveal>
      </section>

      {/* Mission closing */}
      <section className="mx-auto max-w-6xl px-6 pb-28 md:pb-36">
        <Reveal className="grid items-center gap-12 md:grid-cols-2">
          <Parallax
            className="grain relative aspect-[4/5] w-full overflow-hidden rounded-[2rem]"
            amount={12}
          >
            <Placeholder
              tone={about.images.mission.tone}
              label={about.images.mission.label}
              src={about.images.mission.src}
            />
          </Parallax>

          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
              {about.missionLabel}
            </p>
            <p className="mt-6 max-w-xl font-display text-lg italic leading-relaxed text-ink/70">
              {about.story[1]}
            </p>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
