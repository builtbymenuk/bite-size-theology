"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState } from "react";

// Negative cursor: a circle that replaces the native pointer on desktop and shows the
// page beneath it as a photo negative (backdrop-filter: invert). Fine-pointer only.
// ponytail: one fixed element, no hover detection, no new dependency. Tunables below.
const SIZE = 26; // px, circle diameter
const SPRING = { stiffness: 500, damping: 40, mass: 0.4 }; // trailing-follow feel

export default function CustomCursor() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-SIZE);
  const y = useMotionValue(-SIZE);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only mice/trackpads get the custom cursor; touch/coarse pointers keep the native one.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const root = document.documentElement;
    root.classList.add("custom-cursor"); // globals.css hides the native cursor while present

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const hide = () => setVisible(false);
    const show = () => setVisible(true);

    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", hide);
    document.addEventListener("pointerenter", show);

    return () => {
      root.classList.remove("custom-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
      document.removeEventListener("pointerenter", show);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full will-change-transform"
      style={{
        // reduced motion snaps to the pointer (JS springs aren't caught by the global CSS guard)
        x: reduce ? x : sx,
        y: reduce ? y : sy,
        width: SIZE,
        height: SIZE,
        marginLeft: -SIZE / 2, // center the circle on the pointer
        marginTop: -SIZE / 2,
        backdropFilter: "invert(1)",
        WebkitBackdropFilter: "invert(1)",
        opacity: visible ? 1 : 0,
      }}
    />
  );
}
