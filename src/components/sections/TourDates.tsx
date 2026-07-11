import Reveal, { RevealItem } from "@/components/ui/Reveal";
import MaskReveal from "@/components/ui/MaskReveal";
import TourRow from "@/components/ui/TourRow";
import type { Region } from "@/lib/content";

export default function TourDates({ region }: { region: Region }) {
  const heading = "heading" in region ? region.heading : undefined;
  const code = "code" in region ? region.code : undefined;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      {heading && (
        <MaskReveal className="text-center font-display text-[clamp(2.25rem,8vw,6.5rem)] font-light uppercase leading-[0.95] tracking-tight">
          {heading}
        </MaskReveal>
      )}
      <MaskReveal className="mt-6 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-cream/50">
        {region.eyebrow}
      </MaskReveal>

      <Reveal stagger className="mt-10 space-y-3 md:mt-14">
        {region.dates.map((d, i) => (
          <RevealItem key={`${d.city}-${d.date}-${i}`}>
            <TourRow date={d} marqueeText={code} />
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}
