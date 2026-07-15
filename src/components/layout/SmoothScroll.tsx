"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Lenis root mode retains its scroll across route changes, so Next's scroll-to-top on
// navigation doesn't stick. Jump to the top on every route change → new pages land at their top.
// (The View Transition captures the OLD page's scroll into its snapshot before this runs, so the
// previous page still animates out frozen at the position the user left it.)
function ScrollReset() {
  const pathname = usePathname();
  const lenis = useLenis();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);
  return null;
}

// Root-mode Lenis drives real window scroll → motion's useScroll/whileInView need no bridging,
// and fixed/sticky nav keeps working. ReactLenis owns its own RAF loop — do not add one.
// MotionConfig reducedMotion="user" makes every motion element skip transforms for users who
// ask for reduced motion, so content lands at its final position instead of animating in.
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root options={{ lerp: 0.1 }}>
        <ScrollReset />
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}
