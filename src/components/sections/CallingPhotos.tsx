"use client";

import { motion, type Variants } from "motion/react";
import Placeholder from "@/components/ui/Placeholder";

// The two Calling photos, revealed the way print-editorial sites do it: a solid panel wipes up off
// the frame while the photo behind counter-scales down to rest. The eye reads it as the image
// settling into place rather than sliding in from somewhere.
//
// Smoothness rules this file follows, learned the hard way from the version before it:
//  1. ONLY transforms animate (translate + scale). No opacity fade on the photo, no animated
//     box-shadow — the shadow and ring live on a STATIC parent so they're never repainted.
//  2. One motion per element. The earlier version drove a scroll-linked drift and a multi-property
//     entrance through the same nodes; two transforms fighting over one element is what made it
//     stutter, especially under Lenis's smooth scroll.
//  3. No scroll-linked parallax here at all. Anything tied to scroll position competes with Lenis
//     for the same frames; a self-contained reveal stays buttery regardless of scroll speed.
//  4. `will-change: transform` promotes each moving layer to its own compositor layer up front,
//     so the first frame isn't the one that pays for it.

const EASE = [0.22, 1, 0.36, 1] as const;

// The covering panel slides up and off. -101% (not -100%) hides the sub-pixel seam some browsers
// leave behind on fractional heights.
const cover: Variants = {
  hidden: { y: "0%" },
  show: { y: "-101%", transition: { duration: 0.95, ease: EASE } },
};

// The photo starts overscaled and eases back to 1 — slightly slower than the wipe, so it is still
// settling as the panel clears. That lag is what makes it feel like depth rather than a slide.
const photo: Variants = {
  hidden: { scale: 1.16 },
  show: { scale: 1, transition: { duration: 1.25, ease: EASE } },
};

function Framed({
  src,
  tone,
  label,
  className,
  frame,
  delay,
}: {
  src?: string;
  tone: React.ComponentProps<typeof Placeholder>["tone"];
  label: string;
  className: string; // position + size
  frame: string; // the static, never-animated shadow/ring treatment
  delay: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ delayChildren: delay }}
    >
      {/* Static: clips the reveal and carries the shadow, so neither is ever animated. */}
      <div className={`relative h-full w-full overflow-hidden ${frame}`}>
        <motion.div
          variants={photo}
          style={{ willChange: "transform" }}
          className="h-full w-full"
        >
          <Placeholder tone={tone} label={label} src={src} />
        </motion.div>
        <motion.div
          variants={cover}
          style={{ willChange: "transform" }}
          className="absolute inset-0 bg-cream"
          aria-hidden
        />
      </div>
    </motion.div>
  );
}

export default function CallingPhotos({
  bible,
  scripture,
}: {
  bible?: string;
  scripture?: string;
}) {
  return (
    <div className="relative min-h-[620px]">
      {/* Open Bible — tall, dominant, anchored right. Reveals first. */}
      <Framed
        src={bible}
        tone="warm"
        label="Open Bible"
        className="absolute right-0 top-0 aspect-[3/4] w-[70%]"
        frame="rounded-2xl shadow-2xl ring-1 ring-black/5"
        delay={0}
      />

      {/* Scripture — smaller, overlaps the Open Bible's left edge. Follows a beat later so the
          overlap assembles in front of the viewer. */}
      <Framed
        src={scripture}
        tone="dark"
        label="Scripture"
        className="absolute left-0 top-32 aspect-[4/5] w-[54%]"
        frame="rounded-2xl shadow-xl ring-4 ring-cream"
        delay={0.22}
      />
    </div>
  );
}
