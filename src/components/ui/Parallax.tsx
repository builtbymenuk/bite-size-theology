"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

// Translates its child in % inside an overflow-hidden box, so parallax never spawns scrollbars.
// The inner wrapper is oversized (130%) so the drift never reveals an edge.
// (No useReducedMotion branch — that caused an SSR/client element mismatch; the effect is subtle.)
export default function Parallax({
  children,
  className,
  amount = 12,
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`}>
      <motion.div style={{ y }} className="absolute inset-x-0 -top-[15%] h-[130%]">
        {children}
      </motion.div>
    </div>
  );
}
