"use client";

import { motion } from "motion/react";

// Per-item entrance for the phone grids. The desktop versions of those sections carry their own
// continuous motion (Podcast.tsx drifts sideways, SeriesWall.tsx loops), which phones don't get —
// so each tile earns its own arrival instead.
//
// One <Reveal> around a whole grid is what this replaces. That fires once, when the grid's top
// edge crosses, and staggers all its children while most are still below the fold — so the cascade
// is over before you scroll to it. An observer per tile means every tile animates as YOU reach it.
//
// Movement is deliberately large (a third of a small tile's width): a 20px nudge on a 170px tile
// reads as nothing on a phone. `x` is what the caller alternates by column so the two halves of a
// grid slide in from opposite sides — a transform, so it never disturbs the grid's row alignment.
//
// No useReducedMotion branch, for the reason spelled out in Reveal.tsx: <MotionConfig
// reducedMotion="user"> already snaps x/y/scale and keeps the opacity fade, and branching here
// would diverge SSR from first client paint. Note that means a visitor with Reduce Motion on
// (Windows 11 "Animation effects" off, iOS Reduce Motion) sees a plain fade — by design.
const EASE = [0.22, 1, 0.36, 1] as const;

export default function TileReveal({
  children,
  className,
  /** horizontal offset to arrive from; callers alternate the sign by column */
  x = 0,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  x?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y: 32, scale: 0.88 }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
    >
      {children}
    </motion.div>
  );
}
