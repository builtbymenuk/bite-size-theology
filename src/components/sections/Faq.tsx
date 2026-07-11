import Reveal from "@/components/ui/Reveal";
import Accordion from "@/components/ui/Accordion";
import ArrowButton from "@/components/ui/ArrowButton";
import { getFaq } from "@/lib/cms";

export default async function Faq() {
  const faq = await getFaq();
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50">
            {faq.supportEyebrow}
          </p>
          <h3 className="mt-3 font-display text-sm uppercase tracking-widest">
            {faq.supportHeading}
          </h3>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink/60">
            {faq.supportBody}
          </p>
          <ArrowButton label={faq.supportCta} className="mt-6" />
        </Reveal>

        <Reveal>
          <h2 className="font-display text-5xl tracking-tight md:text-6xl">
            {faq.headingLead}{" "}
            <span className="italic text-gold">{faq.headingScript}</span>
          </h2>
          <div className="mt-8">
            <Accordion items={faq.items} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
