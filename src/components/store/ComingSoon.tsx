import Reveal from "@/components/ui/Reveal";
import ArrowButton from "@/components/ui/ArrowButton";

// Stands in for the product grid while `store.comingSoon` is on in Strapi (see getStore in
// lib/cms.ts). Used by both shop surfaces — the homepage collection strip and /store — so the
// wording only has to be written once, in the CMS.
export default function ComingSoon({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <Reveal className={className}>
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink/20 px-6 py-20 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50">Coming soon</p>
        <h3 className="mt-4 font-display text-4xl tracking-tight md:text-5xl">
          The shop opens soon
        </h3>
        <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink/60">{message}</p>
        <ArrowButton label="Get in touch" href="/contact" className="mt-8" />
      </div>
    </Reveal>
  );
}
