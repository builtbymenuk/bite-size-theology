import Reveal from "@/components/ui/Reveal";
import BentoCard from "@/components/ui/BentoCard";
import ArrowButton from "@/components/ui/ArrowButton";
import { getCollection, getStore } from "@/lib/cms";
import ComingSoon from "@/components/store/ComingSoon";
import { linkProps } from "@/lib/links";
import type { Product } from "@/lib/content";

function ProductCard({
  product,
  imageLabel,
}: {
  product: Product;
  imageLabel: string;
}) {
  const p = linkProps(product.url); // clickable only when a CMS url is set
  const inner = (
    <>
      <BentoCard
        className="aspect-[4/5]"
        image={{ tone: product.tone, label: imageLabel, src: product.image }}
      >
        {"tag" in product && product.tag ? (
          <span className="absolute left-4 top-4 rounded-full bg-cream px-3 py-1 text-[10px] uppercase tracking-widest text-ink">
            {product.tag}
          </span>
        ) : null}
      </BentoCard>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-base uppercase tracking-wide">
          {product.name}
        </h3>
        <span className="shrink-0 text-sm text-ink/60">{product.price}</span>
      </div>
    </>
  );
  return <Reveal>{p.href ? <a {...p} className="block">{inner}</a> : inner}</Reveal>;
}

export default async function Collection() {
  // The store's coming-soon switch also governs this strip, so the shop is never half-open.
  const [collection, store] = await Promise.all([getCollection(), getStore()]);
  const [tote, vol1, journal] = collection.products;

  const quote = (
    <Reveal className="flex flex-col justify-center">
      <p className="font-display text-2xl italic leading-snug md:text-3xl">
        &ldquo;{collection.quote.text}&rdquo;
      </p>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">
        {collection.quote.body}
      </p>
      <ArrowButton label={collection.quote.cta} href={collection.quote.ctaUrl} className="mt-8" />
    </Reveal>
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal className="flex items-end justify-between border-b border-ink/10 pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50">
            {collection.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-5xl tracking-tight md:text-6xl">
            {collection.heading}
          </h2>
        </div>
        <a
          {...linkProps(collection.linkUrl)}
          className="hidden text-[11px] uppercase tracking-widest text-ink/60 transition-colors hover:text-ink md:block"
        >
          {collection.link} →
        </a>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
        {store.comingSoon ? (
          <>
            <ComingSoon message={store.comingSoonMessage} />
            {quote}
          </>
        ) : (
          <>
            <ProductCard product={tote} imageLabel="Tote — Study Guide" />
            <ProductCard product={vol1} imageLabel="Book — Vol. 1" />
            {quote}
            <ProductCard product={journal} imageLabel="Sermon Journal" />
          </>
        )}
      </div>
    </section>
  );
}
