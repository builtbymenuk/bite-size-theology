"use client";

import { motion } from "motion/react";
import { fadeUp, staggerContainer } from "@/lib/motion";

// Reduced motion is handled globally by <MotionConfig reducedMotion="user"> (in SmoothScroll):
// it keeps the opacity fade and drops the transform. Branching on useReducedMotion() here would
// make SSR (null) and client (true) render different elements → React keeps opacity:0 → blank.

type Props = {
  children: React.ReactNode;
  className?: string;
  /** container that staggers RevealItem children */
  stagger?: boolean;
};

export default function Reveal({ children, className, stagger }: Props) {
  return (
    <motion.div
      className={className}
      variants={stagger ? staggerContainer : fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </motion.div>
  );
}

/** child of a <Reveal stagger> container */
export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}
