import Reveal from "@/components/ui/Reveal";
import ProductCard from "@/components/store/ProductCard";
import type { StoreProduct } from "@/lib/content";

// A curated, non-filterable row (Best Sellers / New Arrivals / You May Also Like). Renders nothing
// when empty so the page never shows a bare heading.
export default function ProductRow({
  heading,
  products,
}: {
  heading: string;
  products: StoreProduct[];
}) {
  if (!products.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <Reveal className="border-b border-ink/10 pb-6">
        <h2 className="font-display text-4xl tracking-tight md:text-5xl">
          {heading}
        </h2>
      </Reveal>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4 md:gap-y-12">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
