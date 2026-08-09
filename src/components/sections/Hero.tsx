"use client";

import { motion } from "motion/react";
import ArrowButton from "@/components/ui/ArrowButton";
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

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-6 font-display text-lg italic text-cream/70"
        >
          {hero.tagline}
        </motion.p>

        <h1 className="font-wordmark text-[clamp(3rem,11vw,10rem)] leading-[0.95] tracking-[0.04em]">
          {hero.titleLines.map((line, i) => (
            <span key={line} className="block overflow-hidden">
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
