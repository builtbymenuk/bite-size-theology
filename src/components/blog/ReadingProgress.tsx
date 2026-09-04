"use client";

import { motion, useScroll } from "motion/react";

// Gold hairline across the top that fills as you read. Belongs to the routed page, so the
// view-transition slide-up carries it correctly — no ::view-transition-group exemption needed
// (unlike the persistent navbar / cart buttons, which sit in the root layout).
export default function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden
      style={{ scaleX: scrollYProgress }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gold"
    />
  );
}
