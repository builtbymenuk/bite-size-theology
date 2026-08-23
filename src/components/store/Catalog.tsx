"use client";

import { useMemo, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import ProductCard from "@/components/store/ProductCard";
import type { StoreProduct, Category } from "@/lib/content";

const PAGE = 8; // catalog page size; "Load more" reveals another PAGE

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
  const [visible, setVisible] = useState(PAGE);
  const shown =
    active === "all" ? products : products.filter((p) => p.category === active);
  const paged = shown.slice(0, visible);

  return (
    <section id="catalog" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-6 border-b border-ink/10 pb-6">
        <h2 className="font-display text-5xl tracking-tight md:text-6xl">
          {heading}
        </h2>
        {tabs.length > 1 && (
          <div
            className="-mx-6 flex w-full gap-2 overflow-x-auto px-6 [scrollbar-width:none] md:mx-0 md:w-auto md:flex-wrap md:overflow-visible md:px-0"
            role="tablist"
            aria-label="Filter products by category"
          >
            {tabs.map((c) => (
              <button
                key={c.slug}
                role="tab"
                aria-selected={active === c.slug}
                onClick={() => {
                  setActive(c.slug);
                  setVisible(PAGE); // reset paging when switching category
                }}
                className={`shrink-0 rounded-full border px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
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
        <>
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 md:gap-y-12 lg:grid-cols-4">
            {paged.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          {visible < shown.length && (
            <div className="mt-14 flex flex-col items-center gap-3">
              <button
                onClick={() => setVisible((v) => v + PAGE)}
                className="rounded-full border border-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-ink transition-colors hover:bg-ink hover:text-cream"
              >
                Load more
              </button>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/40">
                Showing {paged.length} of {shown.length}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="mt-12 text-sm text-ink/50">
          No products in this category yet.
        </p>
      )}
    </section>
  );
}
