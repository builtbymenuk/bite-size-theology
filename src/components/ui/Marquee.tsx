"use client";

import { motion, useReducedMotion } from "motion/react";

// Infinite horizontal ticker. Content is duplicated so x:-50% loops seamlessly.
// The ONE effect needing explicit reduced-motion gating (repeat: Infinity): under reduce we
// drop the animate/transition VALUES but keep the element type motion.span, so the server
// render (reduce === null → animated) matches first client paint — no hydration mismatch.
export default function Marquee({
  text,
  className,
  duration = 8, // seconds per loop; higher = slower. Longer text needs a higher value to read.
}: {
  text: string;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const set = Array.from({ length: 4 }, () => text);

  return (
    <span className={`inline-flex overflow-hidden ${className ?? ""}`}>
      <motion.span
        className="flex shrink-0 gap-3 whitespace-nowrap pr-3"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={reduce ? undefined : { duration, ease: "linear", repeat: Infinity }}
      >
        {[...set, ...set].map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </motion.span>
    </span>
  );
}
