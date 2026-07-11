import Reveal from "@/components/ui/Reveal";
import { getPodcastPage } from "@/lib/cms";

// Small inline stroke icons — no icon lib is installed, three glyphs don't warrant one.
function Icon({ name }: { name: "mic" | "globe" | "award" }) {
  const p = {
    className: "h-7 w-7",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "mic")
    return (
      <svg {...p}>
        <rect x="9" y="2" width="6" height="11" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
      </svg>
    );
  if (name === "globe")
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" />
      </svg>
    );
  return (
    <svg {...p}>
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14l-2 7 5-3 5 3-2-7" />
    </svg>
  );
}

export default async function PodcastStats() {
  const podcastPage = await getPodcastPage();
  return (
    <section className="bg-ink text-cream">
      <Reveal className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-cream/10 px-6 py-14 md:grid-cols-3 md:divide-x md:divide-y-0 md:py-20">
        {podcastPage.stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-3 px-6 py-8 text-center md:py-2"
          >
            <span className="text-gold">
              <Icon name={s.icon} />
            </span>
            <span className="font-display text-4xl leading-none md:text-5xl">
              {s.value}
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-cream/50">
              {s.label}
            </span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
