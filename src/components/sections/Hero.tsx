"use client";

import { motion } from "motion/react";
import ArrowButton from "@/components/ui/ArrowButton";
import SocialLinks from "@/components/layout/SocialLinks";
import type { Hero } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero({ hero }: { hero: Hero }) {
  return (
    <section className="relative flex h-[100svh] min-h-[560px] w-full items-end overflow-hidden bg-charcoal pb-[max(2.5rem,env(safe-area-inset-bottom))] text-cream md:min-h-[640px] md:items-center md:pb-0">
      {/* Pastor portrait. Desktop: anchored far right and blended into the navy so the title stays
          clear on the left. Phones: there's no "right" to spare at 375px — squeezed into a strip it
          showed a shoulder — so it spans the top of the screen (starting under the nav pill, where
          the face lands) and dissolves downward into the copy anchored at the bottom. Cropped from
          the brand banner (wordmark removed). */}
      <div className="pointer-events-none absolute inset-x-0 top-14 h-[62%] md:inset-x-auto md:inset-y-0 md:right-0 md:top-0 md:h-auto md:w-[56%] md:translate-x-[10%] lg:w-[46%]">
        {/* eslint-disable-next-line @next/next/no-img-element -- CMS/remote or local crop; fill layout */}
        <img
          src={hero.bgImage}
          alt="Caleb Griffith"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* fade the crop's left edge + bottom into the navy (hides the rectangular seam) */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-charcoal via-charcoal/55 to-transparent md:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-transparent md:via-charcoal/10" />
        {/* phones only: soften the photo's top edge under the nav pill */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-charcoal/70 to-transparent md:hidden" />
      </div>
      {/* Royal-blue glow echoing the YouTube banner */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_22%_16%,rgba(37,99,173,0.42),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-3 font-display text-lg italic text-cream/80 md:mb-6 md:text-cream/70"
        >
          {hero.tagline}
        </motion.p>

        {/* Aileron Black Italic — the logo's own typeface. `italic` here selects a real drawn
            italic, so the previous skewX scaffolding is gone: no nested transform span, and no
            font-synthesis guard, because nothing is being faked. Cinzel's 0.04em letterspacing was
            for inscriptional roman caps; a heavy grotesque wants it tighter. */}
        <h1 className="font-lockup text-[clamp(2.75rem,15vw,12rem)] md:text-[clamp(3.25rem,13vw,12rem)] font-black italic uppercase leading-[0.9] tracking-[-0.015em]">
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
          className="mt-6 flex flex-col gap-6 md:mt-10 md:flex-row md:items-end md:justify-between md:gap-8"
        >
          <div>
            <p className="max-w-md text-sm leading-relaxed text-cream/70">
              {hero.subtext}
            </p>
            {/* Under the headline, in the reading line: the outlined circles echo the CTA's arrow ring. */}
            <SocialLinks socials={hero.socials} dark size={20} className="mt-6 flex gap-3" />
          </div>
          <ArrowButton dark label={hero.cta} href={hero.ctaUrl} className="self-start text-cream md:self-auto" />
        </motion.div>
      </div>
    </section>
  );
}
