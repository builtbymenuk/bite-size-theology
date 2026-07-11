import Reveal from "@/components/ui/Reveal";
import PolaroidStack from "@/components/ui/PolaroidStack";
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

        <Reveal className="relative min-h-[440px]">
          <PolaroidStack
            className="h-full"
            photos={[
              {
                tone: "warm",
                label: "Open Bible",
                rotate: 4,
                className: "absolute right-2 top-0 w-56",
              },
              {
                tone: "dark",
                label: "Scripture",
                rotate: -6,
                className: "absolute left-2 top-20 w-44",
              },
            ]}
          />
          <div className="absolute bottom-2 right-4 w-64 rounded-xl bg-charcoal p-5 text-cream shadow-2xl">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
              {calling.rooted.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cream/80">
              {calling.rooted.body}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
