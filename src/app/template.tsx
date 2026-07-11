"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";

const EASE = [0.76, 0, 0.24, 1] as const;

// Route transition. The incoming page slides up from the bottom (translateY) while fading in
// (opacity); the exit is configured to reverse it. `template` re-renders per navigation so the
// enter fires every time. The fixed nav and the crossfading background live in the layout (never
// transformed), so the nav stays pinned and the background dissolves to its darker/blurred state
// independently — together this reproduces the reference's cross-dissolve.
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        data-page-transition
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
