import Reveal from "@/components/ui/Reveal";
import Placeholder from "@/components/ui/Placeholder";
import { getCalling } from "@/lib/cms";

export default async function Calling() {
  const calling = await getCalling();
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="grid gap-16 lg:grid-cols-2 lg:gap-12">
        <Reveal className="max-w-xl">
          <h2 className="font-display leading-none">
            <span className="block text-5xl italic text-gold md:text-6xl">
              {calling.headingScript}
            </span>
            <span className="-mt-1 block text-6xl tracking-tight md:text-7xl">
              {calling.heading}
            </span>
          </h2>

          <p className="mt-8 max-w-md font-display text-xl italic leading-snug text-gold md:text-2xl">
            &ldquo;{calling.quote}&rdquo;
          </p>

          <p className="mt-10 text-xs uppercase tracking-[0.2em] text-ink/60">
            {calling.introLabel}
          </p>
          {calling.body.map((p, i) => (
            <p key={i} className="mt-4 max-w-md text-sm leading-relaxed text-ink/70">
              {p}
            </p>
          ))}
          <p className="mt-8 font-display text-2xl italic">{calling.signature}</p>
        </Reveal>

        <Reveal className="relative min-h-[620px]">
          {/* Open Bible — tall, dominant, anchored right. No tilt. */}
          <div className="absolute right-0 top-0 aspect-[3/4] w-[70%] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5">
            <Placeholder tone="warm" label="Open Bible" src={calling.images?.bible} />
          </div>

          {/* Scripture — smaller, overlaps the Open Bible's left edge. */}
          <div className="absolute left-0 top-32 aspect-[4/5] w-[54%] overflow-hidden rounded-2xl shadow-xl ring-4 ring-cream">
            <Placeholder tone="dark" label="Scripture" src={calling.images?.scripture} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
