import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import BentoCard from "@/components/ui/BentoCard";
import AddToCart from "@/components/store/AddToCart";
import { formatUSD } from "@/lib/pricing";
import { getUpcomingBook } from "@/lib/cms";

// The book, featured at the top of the shop. Self-fetching and self-hiding, exactly like
// UpcomingBook on the homepage — the CMS toggle is the on/off switch, and an untoggled book
// renders nothing at all (no heading, no gap).
//
// Two CMS records meet here on purpose:
//  - `upcoming-book` owns the EDITORIAL copy (eyebrow, title, blurb, release label) and the toggle.
//  - the linked `product` owns the COMMERCE (price, cover, sold-out) — because checkout re-looks
//    every line up by slug in Strapi and trusts only the stored price. A book that isn't a real
//    product therefore cannot be bought, so with no product linked this degrades to a teaser.
export default async function BookFeature() {
  const book = await getUpcomingBook();
  if (!book.showInStore) return null;

  const product = book.product;
  const cover = product?.images[0];

  return (
    <section className="border-b border-ink/10 bg-[#e6ecf4]">
      <Reveal className="mx-auto grid max-w-7xl items-center gap-x-12 gap-y-10 px-6 py-20 md:grid-cols-2">
        <BentoCard
          className="aspect-[3/4] max-w-sm"
          image={{ tone: "gold", label: cover ? "" : "Book Cover", src: cover }}
        />

        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50">
            {book.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">
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

          {product ? (
            <>
              <p className="mt-6 text-2xl text-ink tabular-nums">
                {product.compareAtPrice ? (
                  <span className="mr-3 text-lg text-ink/35 line-through">
                    {formatUSD(product.compareAtPrice)}
                  </span>
                ) : null}
                {formatUSD(product.price)}
              </p>
              <AddToCart product={product} />
              <Link
                href={`/store/${product.slug}`}
                // block, not inline-block: the sold-out branch of AddToCart returns an inline-block
                // pill, and two inline-level siblings would share a line with no gap between them.
                // w-fit keeps the hover/focus target on the text rather than the whole column.
                className="mt-6 block w-fit text-[11px] uppercase tracking-[0.22em] text-ink/50 transition-colors hover:text-gold"
              >
                Full details →
              </Link>
            </>
          ) : (
            // No product linked yet — nothing to price or add to a cart, so say so rather than
            // rendering a button that would fail at checkout.
            <p className="mt-8 inline-block rounded-full border border-ink/20 px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] text-ink/50">
              Coming soon
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
