import Reveal from "@/components/ui/Reveal";
import { getPodcastPage } from "@/lib/cms";

// Static faint pill row. Repeated so it overflows the viewport, then clipped by the section's
// overflow-hidden — same "words bleeding off both edges" look as the mockup, no marquee motion.
function PillRow({ pills, offset = 0 }: { pills: string[]; offset?: number }) {
  const w = pills;
  const rotated = [...w.slice(offset), ...w.slice(0, offset)];
  const wide = [...rotated, ...rotated, ...rotated];
  return (
    <div className="flex justify-center gap-3 whitespace-nowrap px-3">
      {wide.map((p, i) => (
        <span
          key={i}
          className="shrink-0 rounded-full border border-ink/10 px-5 py-2 text-sm text-ink/30"
        >
          {p}
        </span>
      ))}
    </div>
  );
}

export default async function PodcastCta() {
  const { cta } = await getPodcastPage();
  return (
    <section className="overflow-hidden bg-cream py-20 md:py-28">
      <PillRow pills={cta.pills} />

      <div className="mx-auto max-w-3xl px-6 py-14 text-center md:py-20">
        <Reveal>
          <h2 className="font-display text-4xl leading-tight tracking-tight text-ink md:text-6xl">
            <span className="block">{cta.headingLead}</span>
            <span className="block italic text-gold">{cta.headingAccent}</span>
          </h2>
        </Reveal>
        <Reveal className="mt-8">
          <p className="mx-auto max-w-md text-sm leading-relaxed text-ink/60">
            {cta.body}
          </p>
        </Reveal>
      </div>

      <PillRow pills={cta.pills} offset={3} />
    </section>
  );
}
