"use client";

import { motion } from "motion/react";
import Parallax from "@/components/ui/Parallax";
import Placeholder from "@/components/ui/Placeholder";
import ArrowButton from "@/components/ui/ArrowButton";
import type { Hero } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero({ hero }: { hero: Hero }) {
  return (
    <section className="relative flex h-[100svh] min-h-[640px] w-full items-center overflow-hidden bg-charcoal text-cream">
      <div className="absolute inset-0">
        <Parallax className="h-full w-full" amount={8}>
          <Placeholder tone="dark" label="Hero — Cathedral Interior" src={hero.bgImage} />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-charcoal/20" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-6 font-display text-lg italic text-cream/70"
        >
          {hero.tagline}
        </motion.p>

        <h1 className="font-display text-[clamp(3rem,11vw,10rem)] font-light leading-[0.9] tracking-tight">
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
          <ArrowButton dark label={hero.cta} className="self-start text-cream md:self-auto" />
        </motion.div>
      </div>
    </section>
  );
}
