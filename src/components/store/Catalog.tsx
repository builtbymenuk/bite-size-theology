"use client";

import { useMemo, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import ProductCard from "@/components/store/ProductCard";
import type { StoreProduct, Category } from "@/lib/content";

export default function Catalog({
  products,
  heading,
  categories,
}: {
  products: StoreProduct[];
  heading: string;
  categories: Category[];
}) {
  // "All" + only the categories that actually have a product, in their CMS-defined order.
  const tabs = useMemo(() => {
    const present = new Set(products.map((p) => p.category).filter(Boolean));
    return [
      { slug: "all", name: "All" },
      ...categories.filter((c) => present.has(c.slug)),
    ];
  }, [products, categories]);

  const [active, setActive] = useState("all");
  const shown =
    active === "all" ? products : products.filter((p) => p.category === active);

  return (
    <section id="catalog" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-6 border-b border-ink/10 pb-6">
        <h2 className="font-display text-5xl tracking-tight md:text-6xl">
          {heading}
        </h2>
        {tabs.length > 1 && (
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter products by category"
          >
            {tabs.map((c) => (
              <button
                key={c.slug}
                role="tab"
                aria-selected={active === c.slug}
                onClick={() => setActive(c.slug)}
                className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  active === c.slug
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/15 text-ink/60 hover:border-ink/40"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </Reveal>

      {shown.length ? (
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-sm text-ink/50">
          No products in this category yet.
        </p>
      )}
    </section>
  );
}
