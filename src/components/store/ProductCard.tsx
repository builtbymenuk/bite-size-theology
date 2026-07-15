import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import BentoCard from "@/components/ui/BentoCard";
import { formatUSD } from "@/lib/pricing";
import { toneFor } from "@/components/store/tone";
import type { StoreProduct } from "@/lib/content";

// Shared (no "use client"): renders in the server ProductRow and inside the client Catalog alike.
export default function ProductCard({ product }: { product: StoreProduct }) {
  const img = product.images[0];
  return (
    <Reveal className="group">
      <Link href={`/store/${product.slug}`} className="block">
        <BentoCard
          className="aspect-[4/5]"
          image={{
            tone: toneFor(product.slug),
            label: img ? "" : product.title,
            src: img,
          }}
        >
          {product.soldOut ? (
            <span className="absolute left-4 top-4 rounded-full bg-ink/90 px-3 py-1 text-[10px] uppercase tracking-widest text-cream">
              Sold Out
            </span>
          ) : product.badge ? (
            <span className="absolute left-4 top-4 rounded-full bg-cream px-3 py-1 text-[10px] uppercase tracking-widest text-ink shadow-sm">
              {product.badge}
            </span>
          ) : null}
          {product.compareAtPrice && !product.soldOut ? (
            <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-[10px] uppercase tracking-widest text-ink">
              Sale
            </span>
          ) : null}
        </BentoCard>
      </Link>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-sm uppercase leading-tight tracking-wide transition-colors group-hover:text-gold">
          <Link href={`/store/${product.slug}`}>{product.title}</Link>
        </h3>
        <span className="shrink-0 text-sm text-ink/60 tabular-nums">
          {product.compareAtPrice ? (
            <span className="mr-2 text-ink/35 line-through">
              {formatUSD(product.compareAtPrice)}
            </span>
          ) : null}
          {formatUSD(product.price)}
        </span>
      </div>
    </Reveal>
  );
}
