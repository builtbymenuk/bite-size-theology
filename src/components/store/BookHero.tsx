import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import BentoCard from "@/components/ui/BentoCard";
import AddToCart from "@/components/store/AddToCart";
import { formatUSD } from "@/lib/pricing";
import { getUpcomingBook } from "@/lib/cms";

// The book IS the shop's hero — the page opens on it, and the apparel starts below the proceeds
// marquee. Unlike the band this replaced there is no visibility gate: something has to be at the
// top of /store, so the editorial half always renders and only the commerce half is conditional.
//
// Two CMS records still meet here on purpose:
//  - `upcoming-book` owns the EDITORIAL copy (eyebrow, title, blurb, release label).
//  - the linked `product` owns the COMMERCE (price, cover, sold-out) — because checkout re-looks
//    every line up by slug in Strapi and trusts only the stored price. A book that isn't a real
//    product therefore cannot be bought, so with no product linked this degrades to a teaser.

// Last word rendered as the gold italic script accent (site-wide heading motif).
function accentHeading(text: string) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return text;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <span className="italic text-gold">{last}</span>
    </>
  );
}

const LINK =
  "text-[11px] uppercase tracking-[0.22em] text-ink/50 transition-colors hover:text-gold";

// `teaser` is the store's coming-soon switch: it drops the linked product so the editorial half
// still renders and the commerce half degrades to the same pill an unlinked book already gets.
export default async function BookHero({ teaser }: { teaser?: boolean }) {
  const book = await getUpcomingBook();
  const product = teaser ? undefined : book.product;
  const cover = product?.images[0] || book.image;

  return (
    // `grain` needs the relative parent (globals.css). overflow-hidden contains the cover's hover
    // tilt and its blurred halo, which both reach past the grid on narrow screens.
    <section className="grain relative overflow-hidden border-b border-ink/10 bg-[#e6ecf4]">
      <div className="mx-auto grid max-w-7xl items-center gap-x-12 gap-y-12 px-6 pb-16 pt-32 md:grid-cols-2 md:pb-24 md:pt-40">
        {/* Sits square with a real shadow so it reads as an object rather than a tile, and
            tilts on hover — the same reward BentoCard's own image zoom gives. The halo keeps a
            pale cover from dissolving into an equally pale band. */}
        <Reveal className="relative mx-auto w-full max-w-sm md:mx-0 md:max-w-md">
          <div
            aria-hidden
            className="absolute -inset-6 rounded-[2rem] bg-gold/10 blur-2xl"
          />
          <BentoCard
            className="relative aspect-[3/4] shadow-2xl shadow-ink/20 transition-transform duration-500 ease-out hover:rotate-[-2.5deg]"
            image={{ tone: "gold", label: cover ? "" : "Book Cover", src: cover }}
          />
        </Reveal>

        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
            {book.eyebrow}
          </p>
          {/* h1, not h2 — this is the shop's top-level heading now. */}
          <h1 className="mt-3 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-tight">
            {accentHeading(book.title)}
          </h1>
          {book.subtitle ? (
            <p className="mt-4 font-display text-xl italic text-ink/70 md:text-2xl">
              {book.subtitle}
            </p>
          ) : null}
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink/60">
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
                className={`mt-6 block w-fit ${LINK}`}
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
        </Reveal>
      </div>
    </section>
  );
}
