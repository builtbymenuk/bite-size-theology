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
import TileReveal from "@/components/ui/TileReveal";
import Placeholder from "@/components/ui/Placeholder";
import ListenWatch from "@/components/ui/ListenWatch";
import type { Podcast, Episode, Tone } from "@/lib/content";

// A slot in the episode wall: always a tone (empty-state color), optionally a real episode
// (image + link + title) overlaid from Strapi.
type WallTile = { tone: Tone } & Episode;

// Carousel dissolves toward the bottom; the left cream scrim (below) handles left readability.
const WALL_FADE = "linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)";
const WALL_FADE_STYLE = {
  maskImage: WALL_FADE,
  WebkitMaskImage: WALL_FADE,
} as const;

const TILE =
  "aspect-[16/10] w-[clamp(180px,24vw,340px)] shrink-0 overflow-hidden rounded-xl lg:w-[clamp(240px,19vw,340px)]";

// One wall tile. With an episode URL it's a link (opens the video in a new tab); otherwise a plain
// block. `className` sizes it (carousel vs mobile grid). `decorative` hides duplicated carousel
// copies from AT/keyboard so each episode is announced/tabbed once. Empty slots show the tone + "Ep N".
function Tile({
  tile,
  n,
  className,
  decorative,
}: {
  tile: WallTile;
  n: number;
  className: string;
  decorative?: boolean;
}) {
  const label = tile.title ?? `Episode ${n}`;
  const inner = (
    <Placeholder
      tone={tile.tone}
      src={tile.image}
      alt={decorative ? "" : label}
      label={`Ep ${n}`}
      sizes="(min-width: 768px) 24vw, 50vw"
    />
  );
  if (!tile.url) return <div className={className}>{inner}</div>;
  return (
    <a
      href={tile.url}
      target="_blank"
      rel="noreferrer"
      title={label}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
      className={`${className} block transition hover:opacity-90`}
    >
      {inner}
    </a>
  );
}

// Scroll-driven row: drifts with page scroll via the `x` MotionValue (no auto-play). Tiles are
// duplicated so the row stays filled across the drift range; the duplicate half is decorative.
function ScrollRow({
  tiles,
  base,
  x,
}: {
  tiles: WallTile[];
  base: number;
  x: MotionValue<string>;
}) {
  return (
    <motion.div style={{ x }} className="flex w-max gap-3 pr-3">
      {tiles.map((tile, i) => (
        <Tile key={`a${i}`} tile={tile} n={base + i} className={TILE} />
      ))}
      {tiles.map((tile, i) => (
        <Tile key={`b${i}`} tile={tile} n={base + i} className={TILE} decorative />
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
    // pointer-events-auto: re-enable clicks for the title/buttons block (its overlay parent is
    // pointer-events-none). The empty space beside it stays click-through so tiles there work.
    <div className="pointer-events-auto max-w-sm">
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

      <h2 className="mt-3 font-display text-4xl font-medium uppercase leading-[0.95] tracking-tight lg:text-5xl">
        {podcast.titleLines.map((l) => (
          // lg keeps each line whole (2 lines total); mobile may wrap on narrow screens.
          <span key={l} className="block lg:whitespace-nowrap">
            {l}
          </span>
        ))}
      </h2>

      <ListenWatch
        actions={podcast.actions}
        youtubeUrl={
          podcast.youtubeChannelId
            ? `https://www.youtube.com/channel/${podcast.youtubeChannelId}`
            : undefined
        }
        className="mt-6"
      />
    </div>
  );
}

export default function Podcast({ podcast }: { podcast: Podcast }) {
  // 15 tiles → 3 rows of 5. Each gallery tone is a slot; episode[i] (image+link+title) overlays it.
  const tiles: WallTile[] = podcast.gallery.map((tone, i) => ({
    tone,
    ...(podcast.episodes[i] ?? {}),
  }));
  const row1 = tiles.slice(0, 5);
  const row2 = tiles.slice(5, 10);
  const row3 = tiles.slice(10, 15);
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

      {/* Carousel band (md and up): normal-flow block below the quote; identity overlaid
          top-left. Phones fall back to the grid further down. */}
      <div className="relative mt-12 hidden md:block lg:mt-20">
        {/* No pointer-events-none here — tiles are links now and must be clickable. */}
        <div style={WALL_FADE_STYLE}>
          <div className="flex flex-col gap-3">
            <ScrollRow tiles={row1} base={1} x={x1} />
            <ScrollRow tiles={row2} base={6} x={x2} />
            <ScrollRow tiles={row3} base={11} x={x3} />
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

        {/* Identity overlay — top-left, over the carousel; nudged in from the left margin. The
            container is click-through (pointer-events-none) so it doesn't block the tiles behind/beside
            it; only the Identity block itself (title + buttons) re-enables pointer events. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
          <Reveal className="pl-6 pr-6 lg:pl-20 lg:pr-8">
            <Identity podcast={podcast} />
          </Reveal>
        </div>
      </div>

      {/* Phones — identity, then a simple tile grid. The carousel needs md: below that its drift
          would park episodes permanently off-screen, where the grid shows all 15. */}
      <div className="mx-auto mt-10 max-w-7xl px-6 md:hidden">
        <Reveal>
          <Identity podcast={podcast} />
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tiles.map((tile, i) => (
            <TileReveal key={i} x={i % 2 ? 26 : -26} delay={(i % 2) * 0.08}>
              <Tile
                tile={tile}
                n={i + 1}
                className="aspect-[16/10] overflow-hidden rounded-lg"
              />
            </TileReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
