"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";

const EASE = [0.76, 0, 0.24, 1] as const;

// placeholder "image" — a stage/bokeh texture from layered radial gradients, so the blur
// on inner pages actually reads. Swap `TEXTURE` for a real photo (next/image) later; the layer and
// the two treatments stay identical.
// Brand atmosphere — the dove logo's own gradient: navy→blue→plum with soft teal/blue/rose bokeh.
const TEXTURE =
  "radial-gradient(55% 50% at 18% 28%, rgba(46,111,214,0.45), transparent 60%)," + // royal blue
  "radial-gradient(45% 45% at 82% 22%, rgba(28,107,126,0.40), transparent 60%)," + // teal
  "radial-gradient(70% 60% at 60% 82%, rgba(176,87,124,0.38), transparent 65%)," + // plum
  "radial-gradient(35% 40% at 38% 68%, rgba(190,205,230,0.25), transparent 60%)," + // soft light
  "linear-gradient(155deg, #123056 0%, #0a1a33 55%, #2a1533 100%)";

// Persistent full-bleed background that crossfades with the route: brighter/sharp on home,
// darker + blurred + desaturated on inner pages (matches the reference video's background shift).
export default function PageBackground() {
  const pathname = usePathname();
  const dark = pathname?.startsWith("/tour");

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0a1a33]">
      {/* Home treatment: brighter, sharp */}
      <motion.div
        className="absolute inset-0"
        style={{ background: TEXTURE, filter: "brightness(0.8) grayscale(0.2)" }}
        initial={false}
        animate={{ opacity: dark ? 0 : 1, scale: dark ? 1.05 : 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      />
      {/* Inner treatment: darker, blurred, desaturated (oversized so blur has no hard edge) */}
      <motion.div
        className="absolute -inset-8"
        style={{ background: TEXTURE, filter: "blur(16px) brightness(0.38) grayscale(1)" }}
        initial={false}
        animate={{ opacity: dark ? 1 : 0, scale: dark ? 1.08 : 1.14 }}
        transition={{ duration: 0.6, ease: EASE }}
      />
    </div>
  );
}
