"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Placeholder from "@/components/ui/Placeholder";

// The two Calling photos. Each gets two independent layers of motion, which is why they're nested:
//   outer — scroll-linked drift, opposite directions, so the pair separates slightly as you pass
//           and reads as two planes at different depths rather than one flat collage.
//   inner — a one-time entrance: the photos converge from opposite sides and straighten up.
// Keeping them on separate elements avoids the two fighting over the same `y`/transform.
const EASE = [0.22, 1, 0.36, 1] as const;

const enter = (fromX: number, tilt: number, delay: number) => ({
  hidden: { opacity: 0, x: fromX, rotate: tilt, scale: 0.94 },
  show: {
    opacity: 1,
    x: 0,
    rotate: 0,
    scale: 1,
    transition: { duration: 0.85, ease: EASE, delay },
  },
});

export default function CallingPhotos({
  bible,
  scripture,
}: {
  bible?: string;
  scripture?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Collapsed to 0 under reduced motion, which also matches SSR's progress-0 first paint, so there
  // is no hydration mismatch (same contract as Podcast.tsx).
  const back = useTransform(scrollYProgress, [0, 1], reduce ? ["0px", "0px"] : ["0px", "-46px"]);
  const front = useTransform(scrollYProgress, [0, 1], reduce ? ["0px", "0px"] : ["0px", "34px"]);

  return (
    <div ref={ref} className="relative min-h-[620px]">
      {/* Open Bible — tall, dominant, anchored right. Enters from the right. */}
      <motion.div style={{ y: back }} className="absolute right-0 top-0 aspect-[3/4] w-[70%]">
        <motion.div
          variants={enter(44, 2.5, 0)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          className="h-full w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5"
        >
          <Placeholder tone="warm" label="Open Bible" src={bible} />
        </motion.div>
      </motion.div>

      {/* Scripture — smaller, overlaps the Open Bible's left edge. Enters from the left, a beat
          later, so the overlap builds in front of the viewer instead of arriving pre-assembled. */}
      <motion.div style={{ y: front }} className="absolute left-0 top-32 aspect-[4/5] w-[54%]">
        <motion.div
          variants={enter(-52, -3.5, 0.18)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          whileHover={{ y: -10, transition: { duration: 0.4, ease: EASE } }}
          className="h-full w-full overflow-hidden rounded-2xl shadow-xl ring-4 ring-cream"
        >
          <Placeholder tone="dark" label="Scripture" src={scripture} />
        </motion.div>
      </motion.div>
    </div>
  );
}
