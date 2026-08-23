// Render per-request against live Strapi (CMS edits show on reload; also avoids baking
// fallback content when Strapi is unreachable at build time).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getStore, getProducts, getCategories } from "@/lib/cms";
import { linkProps } from "@/lib/links";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/ui/Reveal";
import Marquee from "@/components/ui/Marquee";
import Placeholder from "@/components/ui/Placeholder";
import ProductRow from "@/components/store/ProductRow";
import BookFeature from "@/components/store/BookFeature";
import Catalog from "@/components/store/Catalog";

export const metadata: Metadata = {
  title: "Shop — Bite Size Theology",
  description:
    "Christian apparel with purpose — wearable conversation starters. 10% of proceeds support mission work.",
};

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

export default async function StorePage() {
  const [store, products, categories] = await Promise.all([
    getStore(),
    getProducts(),
    getCategories(),
  ]);
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const newArrivals = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-32 md:pt-40">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50">
              {store.heroEyebrow}
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] tracking-tight">
              {accentHeading(store.heroHeading)}
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/60">
              {store.heroSubtext}
            </p>
            <a
              {...(linkProps(store.heroCtaUrl).href ? linkProps(store.heroCtaUrl) : { href: "#catalog" })}
              className="mt-8 inline-flex items-center rounded-full bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal"
            >
              {store.heroCta}
            </a>
          </Reveal>
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl md:aspect-square">
              <Placeholder
                tone="warm"
                src={store.heroImage}
                label={store.heroImage ? "" : "Bite Size Theology — Apparel"}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Proceeds banner */}
      <div className="border-y border-ink/10 bg-gold/90 py-3 text-ink">
        <Marquee
          text={`${store.proceedsBanner} • `}
          duration={30}
          className="w-full text-[11px] font-medium uppercase tracking-[0.25em]"
        />
      </div>

      {/* Self-hiding: renders only while "Show on shop page" is ticked in the CMS. */}
      <BookFeature />

      <ProductRow heading={store.bestSellersHeading} products={featured} />
      <ProductRow heading={store.newArrivalsHeading} products={newArrivals} />

      <Catalog heading="Shop All" products={products} categories={categories} />

      {/* Founder */}
      <section className="border-t border-ink/10 bg-[#e6ecf4]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 md:grid-cols-2 md:items-center">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Placeholder
                tone="dark"
                src={store.founderImage}
                label={store.founderImage ? "" : "Meet the Founder"}
              />
            </div>
          </Reveal>
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50">
              {store.founderEyebrow}
            </p>
            <h2 className="mt-4 font-display text-4xl tracking-tight md:text-5xl">
              {store.founderHeading}
            </h2>
            <p className="mt-6 max-w-md whitespace-pre-line text-sm leading-relaxed text-ink/70">
              {store.founderBody}
            </p>
            <a
              {...(linkProps(store.founderCtaUrl).href ? linkProps(store.founderCtaUrl) : { href: "#catalog" })}
              className="mt-8 inline-block rounded-full border border-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-ink transition-colors hover:bg-ink hover:text-cream"
            >
              {store.founderCta}
            </a>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
