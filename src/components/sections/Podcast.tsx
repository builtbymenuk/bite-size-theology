"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import Reveal, { RevealItem } from "@/components/ui/Reveal";
import Placeholder from "@/components/ui/Placeholder";
import ListenWatch from "@/components/ui/ListenWatch";
import type { Podcast } from "@/lib/content";

// Carousel dissolves toward the bottom; the left cream scrim (below) handles left readability.
const WALL_FADE = "linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)";
const WALL_FADE_STYLE = {
  maskImage: WALL_FADE,
  WebkitMaskImage: WALL_FADE,
} as const;

const TILE =
  "aspect-[16/10] w-[clamp(240px,19vw,340px)] shrink-0 overflow-hidden rounded-xl";

function Tile({
  tone,
  n,
}: {
  tone: React.ComponentProps<typeof Placeholder>["tone"];
  n: number;
}) {
  return (
    <div className={TILE}>
      <Placeholder tone={tone} label={`Ep ${n}`} />
    </div>
  );
}

// Scroll-driven row: drifts with page scroll via the `x` MotionValue (no auto-play). Tiles are
// duplicated so the row is wide enough to stay filled across the drift range.
function ScrollRow({
  tones,
  base,
  x,
}: {
  tones: readonly React.ComponentProps<typeof Placeholder>["tone"][];
  base: number;
  x: MotionValue<string>;
}) {
  const seq = [...tones, ...tones];
  return (
    <motion.div style={{ x }} className="flex w-max gap-3 pr-3">
      {seq.map((tone, i) => (
        <Tile key={i} tone={tone} n={base + (i % tones.length)} />
      ))}
    </motion.div>
  );
}

function Laurel() {
  return (
    <svg
      width="42"
      height="34"
      viewBox="0 0 42 34"
      fill="none"
      aria-hidden
      className="shrink-0 text-ink/70"
    >
      {[0, 1].map((s) => (
        <g
          key={s}
          transform={s ? "translate(42,0) scale(-1,1)" : undefined}
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        >
          <path d="M21 31C13.5 31 7.6 25.5 7 18.4C6.7 14 8 9.6 11 6" />
          <path d="M7.2 22c-2.6.5-4.6-.4-5.8-2.4M7.5 18c-2.6.2-4.6-1-5.4-3.2M8.7 14.2c-2.4-.2-4.2-1.6-4.7-3.8M10.6 10.8c-2.2-.6-3.7-2.2-3.9-4.4M13.2 8c-2-.9-3.2-2.7-3-4.9" />
        </g>
      ))}
    </svg>
  );
}

// Badge + title + platform buttons. Rendered over the carousel (lg) and in the mobile block.
function Identity({ podcast }: { podcast: Podcast }) {
  return (
    <div className="max-w-sm">
      <div className="flex items-center gap-2.5">
        <Laurel />
        <div className="leading-tight">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-ink">
            {podcast.badge.rank}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">
            {podcast.badge.category}
          </p>
        </div>
      </div>

      <h2 className="mt-3 font-display text-4xl font-medium uppercase leading-[0.95] tracking-tight md:text-5xl">
        {podcast.titleLines.map((l) => (
          // lg keeps each line whole (2 lines total); mobile may wrap on narrow screens.
          <span key={l} className="block lg:whitespace-nowrap">
            {l}
          </span>
        ))}
      </h2>

      <ListenWatch actions={podcast.actions} className="mt-6" />
    </div>
  );
}

export default function Podcast({ podcast }: { podcast: Podcast }) {
  // 15 tiles → 3 rows of 5.
  const row1 = podcast.gallery.slice(0, 5);
  const row2 = podcast.gallery.slice(5, 10);
  const row3 = podcast.gallery.slice(10, 15);
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Tiles move ONLY with page scroll (no auto-play): rows 1 & 3 ease left, row 2 eases right.
  // Reduced motion collapses the range to 0 (matches SSR's progress-0 first paint — no mismatch).
  const x1 = useTransform(scrollYProgress, [0, 1], reduce ? ["0px", "0px"] : ["0px", "-160px"]);
  const x2 = useTransform(scrollYProgress, [0, 1], reduce ? ["0px", "0px"] : ["0px", "120px"]);
  const x3 = useTransform(scrollYProgress, [0, 1], reduce ? ["0px", "0px"] : ["0px", "-160px"]);

  return (
    <section ref={ref} className="overflow-hidden bg-cream py-16 md:py-24">
      {/* Top section — normal flow, ABOVE the carousel: rule + eyebrow/note, then the quote.
          Full-width with a small gutter (not the centered max-w column). */}
      <Reveal stagger className="px-8">
        <RevealItem className="flex items-start justify-between gap-6 border-t border-ink/10 pt-5">
          <p className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.25em] text-ink/60">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" />
            {podcast.eyebrow}
          </p>
          <p className="hidden text-right text-[11px] uppercase tracking-[0.25em] text-ink/45 sm:block">
            {podcast.note}
          </p>
        </RevealItem>

        <RevealItem>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-ink/60">
            &ldquo;{podcast.quote}&rdquo;
          </p>
        </RevealItem>
      </Reveal>

      {/* Carousel band (lg) — normal-flow block below the quote; identity overlaid top-left */}
      <div className="relative mt-20 hidden lg:block">
        <div style={WALL_FADE_STYLE} className="pointer-events-none">
          <div className="flex flex-col gap-3">
            <ScrollRow tones={row1} base={1} x={x1} />
            <ScrollRow tones={row2} base={6} x={x2} />
            <ScrollRow tones={row3} base={11} x={x3} />
          </div>
        </div>

        {/* Solid cream highlight behind the title (top-left) that fades into the carousel, so the
            title reads on clean cream even over the tiles — like the reference. */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(68% 82% at 9% 17%, var(--color-cream) 0%, var(--color-cream) 48%, transparent 82%)",
          }}
        />
        {/* Soft fade on the right edge */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[12%] bg-gradient-to-l from-cream to-transparent" />

        {/* Identity overlay — top-left, over the carousel; nudged in from the left margin. */}
        <div className="absolute inset-x-0 top-0 z-10">
          <Reveal className="pl-20 pr-8">
            <Identity podcast={podcast} />
          </Reveal>
        </div>
      </div>

      {/* Mobile — identity, then a simple tile grid (carousel is lg-only) */}
      <div className="mx-auto mt-10 max-w-7xl px-6 lg:hidden">
        <Reveal>
          <Identity podcast={podcast} />
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {podcast.gallery.map((tone, i) => (
            <div key={i} className="aspect-[16/10] overflow-hidden rounded-lg">
              <Placeholder tone={tone} label={`Ep ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
