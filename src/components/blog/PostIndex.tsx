"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import Placeholder from "@/components/ui/Placeholder";
import PostRow from "./PostRow";
import type { Blog, Post, PostCategory } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { stiffness: 260, damping: 30, mass: 0.6 };

// The reading index: posts as numbered ledger rows rather than cards, with the hovered row's
// cover floating in and trailing the cursor. That preview is the page's one structural gesture —
// the same role the sticky-hero stack plays on the homepage or the poster wall on /podcast.
export default function PostIndex({
  blog,
  posts,
  categories,
}: {
  blog: Blog;
  posts: Post[];
  categories: PostCategory[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Post | null>(null);
  // Set in an effect, so server render and first client paint agree (false on both). Branching on
  // a media query during render is what Reveal.tsx warns against.
  const [previewable, setPreviewable] = useState(false);

  useEffect(() => {
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Reduce Motion drops the floating cover entirely rather than moving it slowly — the row's
    // own hover tint and arrow still show which line you're on.
    const sync = () => setPreviewable(hover.matches && !reduce.matches);
    sync();
    hover.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      hover.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
    };
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);
  const primed = useRef(false);

  // The very first pointer position is jumped to, not sprung to — otherwise the card swoops in
  // from the top-left corner the first time you touch a row.
  const track = (e: React.MouseEvent) => {
    x.set(e.clientX);
    y.set(e.clientY);
    if (!primed.current) {
      primed.current = true;
      sx.jump(e.clientX);
      sy.jump(e.clientY);
    }
  };

  // Only offer a pill an editor can actually land on — a category with nothing published under
  // it would filter the list to nothing.
  const used = useMemo(() => {
    const slugs = new Set(posts.map((p) => p.category?.slug).filter(Boolean));
    return categories.filter((c) => slugs.has(c.slug));
  }, [posts, categories]);

  const shown = active ? posts.filter((p) => p.category?.slug === active) : posts;

  if (!posts.length) {
    return (
      <p className="mx-auto max-w-md py-24 text-center text-sm leading-relaxed text-ink/50">
        {blog.emptyMessage}
      </p>
    );
  }

  return (
    <>
      {used.length ? (
        <div className="sticky top-20 z-20 -mx-6 mb-2 flex gap-2 overflow-x-auto bg-cream/85 px-6 py-4 backdrop-blur-md">
          {[{ slug: null, name: blog.allLabel }, ...used].map((c) => (
            <button
              key={c.slug ?? "all"}
              type="button"
              onClick={() => setActive(c.slug)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] transition-colors ${
                active === c.slug
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/15 text-ink/60 hover:border-ink/40 hover:text-ink"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}

      <div onMouseMove={previewable ? track : undefined}>
        {shown.map((p, i) => (
          <PostRow
            key={p.slug}
            post={p}
            index={i}
            onEnter={previewable ? (e) => { track(e); setHovered(p); } : undefined}
            onLeave={previewable ? () => setHovered(null) : undefined}
          />
        ))}
        <div className="border-t border-ink/12" />
      </div>

      {/* Outer node carries the cursor position; the inner one centres the card on it. Splitting
          them keeps motion's transform off the same element as the -translate-*-1/2 utilities. */}
      {previewable ? (
        <motion.div
          aria-hidden
          style={{ x: sx, y: sy }}
          className="pointer-events-none fixed left-0 top-0 z-40"
        >
          <div className="-translate-x-1/2 -translate-y-1/2">
            <AnimatePresence>
              {hovered?.cover ? (
                <motion.div
                  key={hovered.slug}
                  initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
                  animate={{ opacity: 1, scale: 1, rotate: -2 }}
                  exit={{ opacity: 0, scale: 0.94, rotate: -4 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="grain relative h-[320px] w-[256px] overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]"
                >
                  <Placeholder src={hovered.cover} tone="light" sizes="256px" alt="" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </>
  );
}
