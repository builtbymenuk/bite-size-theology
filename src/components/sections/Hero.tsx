"use client";

import { motion } from "motion/react";
import ArrowButton from "@/components/ui/ArrowButton";
import SocialLinks from "@/components/layout/SocialLinks";
import type { Hero } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero({ hero }: { hero: Hero }) {
  return (
    <section className="relative flex h-[100svh] min-h-[640px] w-full items-center overflow-hidden bg-charcoal text-cream">
      {/* Pastor portrait, anchored far right and blended into the navy so the title stays clear on
          the left. Cropped from the brand banner (wordmark removed). */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[72%] translate-x-[10%] sm:w-[56%] lg:w-[46%]">
        {/* eslint-disable-next-line @next/next/no-img-element -- CMS/remote or local crop; fill layout */}
        <img
          src={hero.bgImage}
          alt="Caleb Griffith"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* fade the crop's left edge + bottom into the navy (hides the rectangular seam) */}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/10 to-transparent" />
      </div>
      {/* Royal-blue glow echoing the YouTube banner */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_22%_16%,rgba(37,99,173,0.42),transparent_70%)]" />

      {/* Socials, pinned to the viewport's top-right corner. Deliberately NOT wrapped in the
          max-w-7xl content gutter: that container centres above 1280px, which parks the icons at
          the headline's edge instead of the actual corner.

          Only the vertical offset is responsive, and the breakpoint is derived, not guessed. The
          pill is max-w-5xl centred inside the header's px-4, so the free margin per side is
              m = (viewport - 1056) / 2
          the pill's right edge lands at viewport - 16 - m, this row's left edge at viewport - 24 - W
          (W = six 32px icons + the chip's px-1), so the actual clearance between them is
              gap = m - W - 8            // the -8 is the right-6 vs px-4 inset difference
          Solving gap >= 24px with W = 200 gives viewport >= 1520px. Below that the row tucks under
          the pill instead, where it cannot collide at all.

          top-7 centres the 32px row on the pill's midline (the pill spans y≈16-74).

          The frosted chip borrows the nav pill's own treatment: six loose icons over a photo read
          as debris, one grouped object reads as intent — and it keeps them legible over the
          portrait. */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.7, ease: EASE }}
        className="absolute right-4 top-20 z-20 sm:right-6 min-[1520px]:top-7"
      >
        <SocialLinks
          socials={hero.socials}
          dark
          size={18}
          className="flex rounded-full border border-cream/15 bg-ink/25 px-1 backdrop-blur-md"
        />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-6 font-display text-lg italic text-cream/70"
        >
          {hero.tagline}
        </motion.p>

        {/* Aileron Black Italic — the logo's own typeface. `italic` here selects a real drawn
            italic, so the previous skewX scaffolding is gone: no nested transform span, and no
            font-synthesis guard, because nothing is being faked. Cinzel's 0.04em letterspacing was
            for inscriptional roman caps; a heavy grotesque wants it tighter. */}
        <h1 className="font-lockup text-[clamp(3.25rem,13vw,12rem)] font-black italic uppercase leading-[0.9] tracking-[-0.015em]">
          {hero.titleLines.map((line, i) => (
            // Keyed by index, not the string: two identical lines would collide on a text key.
            // px/-mx pair: overflow-hidden clips at the PADDING box, so the padding gives the
            // italic's overhang room while the negative margin keeps the text optically flush left
            // with the tagline and subtext below.
            <span key={i} className="block overflow-hidden px-[0.1em] -mx-[0.1em]">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.9, ease: EASE }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
          className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
        >
          <p className="max-w-md text-sm leading-relaxed text-cream/70">
            {hero.subtext}
          </p>
          <ArrowButton dark label={hero.cta} href={hero.ctaUrl} className="self-start text-cream md:self-auto" />
        </motion.div>
      </div>
    </section>
  );
}
