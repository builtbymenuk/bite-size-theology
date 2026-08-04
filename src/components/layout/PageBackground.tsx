"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";

const EASE = [0.76, 0, 0.24, 1] as const;

// placeholder "image" — a stage/bokeh texture from layered radial gradients, so the blur
// on inner pages actually reads. Swap `TEXTURE` for a real photo (next/image) later; the layer and
// the two treatments stay identical.
const TEXTURE =
  "radial-gradient(55% 50% at 18% 28%, rgba(120,140,180,0.55), transparent 60%)," +
  "radial-gradient(45% 45% at 82% 22%, rgba(184,148,95,0.5), transparent 60%)," +
  "radial-gradient(70% 60% at 60% 82%, rgba(70,84,104,0.55), transparent 65%)," +
  "radial-gradient(35% 40% at 38% 68%, rgba(200,180,140,0.3), transparent 60%)," +
  "linear-gradient(160deg, #15171d 0%, #0b0c10 100%)";

// Persistent full-bleed background that crossfades with the route: brighter/sharp on home,
// darker + blurred + desaturated on inner pages (matches the reference video's background shift).
export default function PageBackground() {
  const pathname = usePathname();
  const dark = pathname?.startsWith("/tour");

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0b0c10]">
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
