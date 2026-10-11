import type { TourDate } from "@/lib/content";
import Marquee from "./Marquee";

// Static rows — no hover fill/invert (it read as distracting). Get-tickets rows are cream links,
// sold-out rows are muted dark. State is conveyed at rest, not on hover.
// Phones stack city over date on the left with the pill on the right; the wrapper is
// `md:contents`, so from md up its children fall back into the single desktop row unchanged.
const INFO = "flex min-w-0 flex-1 flex-col gap-0.5 md:contents";
const ROW = "flex items-center gap-4 rounded-full px-5 py-4 md:px-7 md:py-5";

export default function TourRow({
  date,
  marqueeText,
}: {
  date: TourDate;
  marqueeText?: string;
}) {
  const marquee = marqueeText && (
    <span className="hidden w-12 shrink-0 md:block">
      <Marquee text={marqueeText} className="text-[10px] uppercase tracking-[0.3em]" />
    </span>
  );

  if (date.status === "get-tickets") {
    return (
      <a href={date.url} className={`${ROW} bg-cream`}>
        <span className="hidden text-ink/40 md:inline">{marquee}</span>
        <span className={INFO}>
          <span className="text-sm font-medium text-ink md:w-48 md:shrink-0 md:text-base">
            {date.city}
          </span>
          <span className="hidden flex-1 text-center text-[11px] uppercase tracking-[0.2em] text-ink/50 md:block">
            {date.venue}
          </span>
          <span className="text-xs font-medium text-blue md:ml-auto md:w-28 md:text-right md:text-sm">
            {date.date}
          </span>
        </span>
        <span className="shrink-0 text-right md:w-32">
          <span className="inline-block rounded-full bg-black px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-white md:py-2 md:text-[10px]">
            Get Tickets
          </span>
        </span>
      </a>
    );
  }

  return (
    <div className={`${ROW} bg-white/5`}>
      <span className="hidden text-cream/40 md:inline">{marquee}</span>
      <span className={INFO}>
        <span className="text-sm font-medium text-cream md:w-48 md:shrink-0 md:text-base">
          {date.city}
        </span>
        <span className="hidden flex-1 text-center text-[11px] uppercase tracking-[0.2em] text-cream/40 md:block">
          {date.venue}
        </span>
        <span className="text-xs text-gold md:ml-auto md:w-28 md:text-right md:text-sm">
          {date.date}
        </span>
      </span>
      <span className="shrink-0 text-right md:w-32">
        <span className="inline-block rounded-full bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-cream/60 md:px-4 md:text-[10px] md:text-cream/50">
          Sold Out
        </span>
      </span>
    </div>
  );
}
