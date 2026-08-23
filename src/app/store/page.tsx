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
import BookHero from "@/components/store/BookHero";
import Catalog from "@/components/store/Catalog";

export const metadata: Metadata = {
  title: "Shop — Bite Size Theology",
  description:
    "Christian apparel with purpose — wearable conversation starters. 10% of proceeds support mission work.",
};

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
      <BookHero />

      {/* Proceeds banner */}
      <div className="border-y border-ink/10 bg-gold/90 py-3 text-ink">
        <Marquee
          text={`${store.proceedsBanner} • `}
          duration={30}
          className="w-full text-[11px] font-medium uppercase tracking-[0.25em]"
        />
      </div>

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
