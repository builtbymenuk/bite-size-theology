"use client";

import { motion } from "motion/react";
import Placeholder from "./Placeholder";

type Photo = {
  tone: React.ComponentProps<typeof Placeholder>["tone"];
  label?: string;
  src?: string; // CMS photo; empty → placeholder
  rotate?: number;
  className?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

// Each photo lands as if tossed onto the card: dropped in from above, over-rotated, a touch small,
// then settling onto its final angle. Later photos land later, so the stack builds front-to-back.
//
// No useReducedMotion() branch — the global <MotionConfig reducedMotion="user"> (in SmoothScroll)
// keeps the opacity fade and drops the transform, and branching here would make SSR and the first
// client render disagree (see the note in Reveal.tsx).
const drop = (rotate: number, i: number) => ({
  hidden: { opacity: 0, y: -34, rotate: rotate + (i % 2 ? -16 : 16), scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    rotate,
    scale: 1,
    transition: { duration: 0.75, ease: EASE, delay: 0.15 + i * 0.14 },
  },
});

// Layered, slightly-rotated photos with white polaroid borders. Position each via `className`.
export default function PolaroidStack({
  photos,
  className,
}: {
  photos: Photo[];
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {photos.map((p, i) => (
        <motion.div
          key={i}
          className={`bg-white p-2 shadow-xl ${p.className ?? ""}`}
          variants={drop(p.rotate ?? 0, i)}
          initial="hidden"
          whileInView="show"
          // Matches Reveal's viewport contract so the photos land with the card, not before it.
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        >
          <div className="aspect-[4/5] overflow-hidden">
            <Placeholder tone={p.tone} label={p.label} src={p.src} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
