"use client";

import { motion } from "motion/react";
import { lineReveal } from "@/lib/motion";

// Masked line-wipe reveal: text slides up from behind a clip mask on scroll-in.
// Reduced motion is handled globally by <MotionConfig reducedMotion="user"> — lineReveal is
// transform-only, so the text just lands at its final position (no useReducedMotion branch,
// which would cause the SSR/client element mismatch the Reveal comment warns about).
export default function MaskReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className={`block ${className ?? ""}`}
        variants={lineReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      >
        {children}
      </motion.span>
    </span>
  );
}
