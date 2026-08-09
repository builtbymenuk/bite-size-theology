import Reveal from "@/components/ui/Reveal";
import BentoCard from "@/components/ui/BentoCard";
import ArrowButton from "@/components/ui/ArrowButton";
import { getUpcomingBook } from "@/lib/cms";

// Self-fetching + self-hiding, like Collection. The CMS `visible` flag is the on/off toggle:
// return null while the book is unpublished, so nothing renders (and no gap) until it's flipped on.
export default async function UpcomingBook() {
  const book = await getUpcomingBook();
  if (!book.visible) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal className="grid grid-cols-1 items-center gap-x-12 gap-y-10 md:grid-cols-2">
        <BentoCard
          className="aspect-[3/4] max-w-md"
          image={{ tone: "gold", label: "Book Cover", src: book.image }}
        />

        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50">
            {book.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-5xl tracking-tight md:text-6xl">
            {book.title}
          </h2>
          {book.subtitle ? (
            <p className="mt-4 font-display text-xl italic text-ink/70">
              {book.subtitle}
            </p>
          ) : null}
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">
            {book.body}
          </p>
          {book.releaseLabel ? (
            <p className="mt-6 text-[11px] uppercase tracking-widest text-ink/50">
              {book.releaseLabel}
            </p>
          ) : null}
          <ArrowButton label={book.cta} href={book.ctaUrl} className="mt-8" />
        </div>
      </Reveal>
    </section>
  );
}
