"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import Reveal, { RevealItem } from "@/components/ui/Reveal";
import TileReveal from "@/components/ui/TileReveal";
import ArrowButton from "@/components/ui/ArrowButton";
import type { PodcastPage } from "@/lib/content";

// The preaching series as a poster wall: three columns of 16:9 posters looping vertically at
// different speeds, forever. The carousel directly above moves HORIZONTALLY with page scroll —
// this moves on its own on the other axis, so the two sections rhyme instead of repeating.
//
// Three rules this file depends on:
//  1. The lightbox is position:fixed, so it must stay OUTSIDE any <Reveal> and outside the looping
//     columns — an animated ancestor would make it resolve against that instead of the viewport.
//  2. It sits below CustomCursor's z-[9999] and matches CartDrawer's z-[110].
//  3. Each column renders its posters TWICE and the keyframes translate a full -50%, which is what
//     makes the loop seamless. The second copy is decorative: hidden from AT and out of the tab
//     order so every series is announced once (same contract as Podcast.tsx's duplicated rows).

export type SeriesCardData = {
  title: string;
  note: string;
  videoId: string | null; // null = an empty frame on the wall, waiting to be filled in Strapi
  playlistId: string | null;
};

const thumb = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

const EASE = [0.22, 1, 0.36, 1] as const;

// How long the cursor must rest on a poster before the muted preview is worth an iframe.
const PREVIEW_DWELL = 400;

const COLUMNS = 3;

// Per-column loop: direction, speed, and a negative delay so the three start out of phase instead
// of marching in step. Written as whole static strings because Tailwind only emits class names it
// can literally find in the source — a template literal would produce nothing.
const LOOPS = [
  "motion-safe:animate-[wall-up_38s_linear_infinite] motion-safe:[animation-delay:-6s]",
  "motion-safe:animate-[wall-down_30s_linear_infinite] motion-safe:[animation-delay:-14s]",
  "motion-safe:animate-[wall-up_46s_linear_infinite] motion-safe:[animation-delay:-3s]",
];

// Dissolves each column into the page at top and bottom so posters enter and leave the loop
// instead of being cut off by a hard edge.
const COL_FADE =
  "linear-gradient(to bottom, transparent 0%, #000 17%, #000 83%, transparent 100%)";
const COL_FADE_STYLE = { maskImage: COL_FADE, WebkitMaskImage: COL_FADE } as const;

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

function Lightbox({ card, onClose }: { card: SeriesCardData; onClose: () => void }) {
  const lenis = useLenis();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Same contract as CartDrawer: stop the Lenis-driven background scroll, focus into the panel,
  // trap Tab, Esc closes, focus goes back to the poster that opened it.
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    lenis?.stop();

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),iframe,input,select,textarea,[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lenis?.start();
      restoreRef.current?.focus?.();
    };
  }, [lenis, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[110]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
        <motion.div
          ref={panelRef} role="dialog" aria-modal="true" aria-label={card.title || "Sermon"}
          className="w-full max-w-4xl"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <div className="overflow-hidden rounded-2xl bg-ink shadow-2xl">
            {/* autoplay is legitimate here — it only ever runs because the visitor clicked play. */}
            <iframe
              className="aspect-video w-full"
              src={`https://www.youtube-nocookie.com/embed/${card.videoId}?autoplay=1&rel=0`}
              title={card.title || "Sermon"}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-6">
            <p className="font-display text-xl text-cream md:text-2xl">
              {card.title}
              {card.note ? (
                <span className="ml-3 text-sm text-cream/50">{card.note}</span>
              ) : null}
            </p>
            <button
              type="button" onClick={onClose} aria-label="Close player"
              className="shrink-0 rounded-full border border-cream/25 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-cream/80 transition hover:bg-cream/10"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// One poster + its caption. A blank videoId renders the empty-frame state instead. `decorative`
// marks the duplicated loop copy: still clickable with a mouse, but invisible to AT and skipped by
// Tab so each series is announced exactly once.
function Poster({
  card, onPlay, decorative,
}: {
  card: SeriesCardData;
  onPlay: () => void;
  decorative?: boolean;
}) {
  const [preview, setPreview] = useState(false);
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  const stop = useCallback(() => {
    if (dwell.current) clearTimeout(dwell.current);
    dwell.current = null;
    setPreview(false);
  }, []);
  // Unmount the embed if the poster goes away mid-hover.
  useEffect(() => stop, [stop]);

  const start = useCallback(
    (e: React.PointerEvent) => {
      // Touch has no hover, and a reduced-motion visitor asked for less movement, not more.
      if (e.pointerType !== "mouse" || reduce) return;
      if (dwell.current) clearTimeout(dwell.current);
      dwell.current = setTimeout(() => setPreview(true), PREVIEW_DWELL);
    },
    [reduce],
  );

  if (!card.videoId) {
    // Same 16:9 box as a real poster, so an unfilled slot holds its place in the loop without
    // disturbing the rhythm of the column.
    return (
      <div>
        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-ink/20 bg-ink/[0.04]">
          <span className="text-[11px] uppercase tracking-[0.22em] text-ink/40">Coming soon</span>
        </div>
        {card.title ? (
          <h3 className="mt-4 font-display text-lg tracking-tight text-ink/35 lg:text-xl">
            {card.title}
          </h3>
        ) : null}
      </div>
    );
  }

  const id = card.videoId;

  return (
    <div className="group">
      <button
        type="button"
        onClick={onPlay}
        onPointerEnter={start}
        onPointerLeave={stop}
        aria-label={`Play ${card.title}`}
        tabIndex={decorative ? -1 : undefined}
        className="relative block aspect-video w-full cursor-pointer overflow-hidden rounded-xl ring-1 ring-ink/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {/* hqdefault always exists but is 480x360 with letterbox bars. Covering a 16:9 box crops
            off exactly those bars — which is the whole reason every poster is aspect-video. */}
        <Image
          src={thumb(id)}
          alt=""
          fill
          sizes="(min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Muted preview — one iframe at a time, only while the cursor rests here. Scaled up past
            the box so YouTube's own chrome falls outside it and overflow-hidden clips it. */}
        {preview ? (
          <iframe
            aria-hidden
            tabIndex={-1}
            title=""
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&playsinline=1&rel=0`}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            className="pointer-events-none absolute inset-0 hidden h-full w-full scale-[1.35] md:block"
          />
        ) : null}

        <span className="pointer-events-none absolute inset-x-0 bottom-0 block h-1/3 bg-gradient-to-t from-ink/60 to-transparent" />
        <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full border border-cream/50 bg-ink/25 text-cream backdrop-blur-sm transition duration-300 group-hover:border-cream group-hover:bg-cream group-hover:text-ink group-focus-visible:border-cream group-focus-visible:bg-cream group-focus-visible:text-ink lg:bottom-4 lg:left-4 lg:h-11 lg:w-11">
          <PlayGlyph className="ml-0.5 h-3.5 w-3.5 lg:h-4 lg:w-4" />
        </span>
      </button>

      {/* Caption sits below the poster, never on it: the church's thumbnails are title cards with
          the series name already burnt in, so type over them doubles up. */}
      <h3 className="mt-4 font-display text-lg tracking-tight text-ink transition-colors group-hover:text-gold lg:text-xl">
        {card.title}
      </h3>
      {card.note ? (
        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink/45">{card.note}</p>
      ) : null}
      {card.playlistId ? (
        <a
          href={`https://www.youtube.com/playlist?list=${card.playlistId}`}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={decorative ? -1 : undefined}
          className="mt-2 inline-block text-[11px] uppercase tracking-[0.22em] text-ink/50 transition-colors hover:text-gold"
        >
          Full series →
        </a>
      ) : null}
    </div>
  );
}

// One looping column of the wall. `y` comes from page scroll — no auto-play — exactly like the
// ScrollRow in Podcast.tsx, only on the other axis.
function LoopColumn({
  cards, loop, onPlay,
}: {
  cards: SeriesCardData[];
  loop: string; // one of LOOPS — direction, speed and phase for this column
  onPlay: (card: SeriesCardData) => void;
}) {
  // Spacing is pb on every item rather than `gap` on the flex column. With `gap` the boundary
  // between the two copies gets one gap while a -50% translate only accounts for half of it, so
  // the loop would jump by half a gap every cycle. Trailing padding halves exactly.
  const run = (decorative?: boolean) =>
    cards.map((c, i) => (
      <div key={`${decorative ? "b" : "a"}${i}`} className="pb-6 lg:pb-10">
        <Poster card={c} onPlay={() => onPlay(c)} decorative={decorative} />
      </div>
    ));

  return (
    // The window the loop runs inside. Masked top and bottom so posters dissolve rather than
    // getting sliced off.
    <div className="h-[600px] overflow-hidden lg:h-[760px]" style={COL_FADE_STYLE}>
      {/* Pauses under the cursor — a poster you are reading or aiming at should hold still. */}
      <div className={`flex flex-col hover:[animation-play-state:paused] ${loop}`}>
        {run()}
        <div aria-hidden className="contents">
          {run(true)}
        </div>
      </div>
    </div>
  );
}

export default function SeriesWall({
  series, posters, placeholders,
}: {
  series: PodcastPage["series"];
  posters: SeriesCardData[];
  placeholders: SeriesCardData[];
}) {
  const [open, setOpen] = useState<SeriesCardData | null>(null);
  const close = useCallback(() => setOpen(null), []);

  // Alternate real / empty while both last, then the leftovers. Appending the placeholders would
  // clump the grey frames into the bottom of the wall; interleaving spreads the real posters
  // through it so every column has something to look at.
  const cards: SeriesCardData[] = [];
  for (let i = 0; i < Math.max(posters.length, placeholders.length); i++) {
    if (posters[i]) cards.push(posters[i]);
    if (placeholders[i]) cards.push(placeholders[i]);
  }

  // The phone layout is TWO columns, and `cards`' alternating order would drop every real
  // poster into the left one and every empty frame into the right. Real-posters-first, then
  // dealt round-robin below, puts something worth looking at in both.
  const stacked = [...posters, ...placeholders];
  const columns = Array.from({ length: COLUMNS }, (_, c) =>
    cards.filter((_, i) => i % COLUMNS === c),
  );

  return (
    // overflow-hidden so nothing the loop translates can spill into the carousel above or the
    // CTA below.
    <section className="overflow-hidden bg-cream pt-20 pb-16 md:pt-28 md:pb-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Same header shape as Collection.tsx: heading left, supporting copy + CTA right. The
            wall gets the full width below it — split into a side column the posters came out too
            small to read as posters. */}
        <Reveal stagger className="flex flex-col gap-8 border-b border-ink/10 pb-10 md:flex-row md:items-end md:justify-between">
          <RevealItem>
            <p className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.3em] text-ink/50">
              <span className="h-1.5 w-1.5 rounded-full bg-ink" />
              {series.eyebrow}
            </p>
            <h2 className="mt-6 font-display text-4xl leading-[1.02] tracking-tight text-ink md:text-6xl">
              <span className="block">{series.headingLead}</span>
              <span className="block italic text-gold">{series.headingAccent}</span>
            </h2>
          </RevealItem>
          <RevealItem className="md:max-w-sm md:pb-2">
            <p className="text-sm leading-relaxed text-ink/60">{series.body}</p>
            <ArrowButton label={series.cta} href={series.ctaUrl} className="mt-7" />
          </RevealItem>
        </Reveal>

        {/* Wall: three looping columns from md up. Phones keep a real 2-col grid so the
            posters line up in rows, and get their motion on arrival instead - each one slides
            in from its own side. An endless loop here would just be a moving tap target,
            since there is no hover to pause it with. */}
        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:hidden">
          {stacked.map((c, i) => (
            <TileReveal
              key={`${c.videoId ?? "soon"}-${i}`}
              x={i % 2 ? 26 : -26}
              delay={(i % 2) * 0.08}
            >
              <Poster card={c} onPlay={() => setOpen(c)} />
            </TileReveal>
          ))}
        </div>

        {/* No <Reveal> here on purpose — the wall announces itself by moving, so a fade-in on
            scroll would just be a second entrance competing with the loop. */}
        <div className="mt-12 hidden gap-4 md:grid md:grid-cols-3 lg:mt-16 lg:gap-8">
          {columns.map((col, c) => (
            <LoopColumn key={c} cards={col} loop={LOOPS[c]} onPlay={setOpen} />
          ))}
        </div>
      </div>

      {/* Outside every Reveal and every drifting column — see the placement rules at the top. */}
      <AnimatePresence>
        {open ? <Lightbox key={open.videoId} card={open} onClose={close} /> : null}
      </AnimatePresence>
    </section>
  );
}
