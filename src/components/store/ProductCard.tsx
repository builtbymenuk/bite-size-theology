import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import BentoCard from "@/components/ui/BentoCard";
import { formatUSD } from "@/lib/pricing";
import { toneFor } from "@/components/store/tone";
import type { StoreProduct } from "@/lib/content";

// Badge pills. Both live in one wrapping flex cluster rather than opposite corners: on a 2-up phone
// grid a tile is ~150px wide, and "Best Seller" + "Sale" pinned left-4/right-4 collided there.
const PILL =
  "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider md:px-3 md:py-1 md:text-[10px] md:tracking-widest";

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
            // Tiles are half the viewport on phones, a quarter on desktop — without this the
            // default "100vw" candidate downloads ~4x the pixels a 150px box can show.
            sizes: "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
          }}
        >
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 md:left-4 md:top-4">
            {product.soldOut ? (
              <span className={`${PILL} bg-ink/90 text-cream`}>Sold Out</span>
            ) : product.badge ? (
              <span className={`${PILL} bg-cream text-ink shadow-sm`}>
                {product.badge}
              </span>
            ) : null}
            {product.compareAtPrice && !product.soldOut ? (
              <span className={`${PILL} bg-gold text-ink`}>Sale</span>
            ) : null}
          </div>
        </BentoCard>
      </Link>
      {/* Stacked on phones — as one row the title had ~80px next to a shrink-0 price and broke to
          one word per line while the price still clipped. Side by side once there's room. */}
      <div className="mt-4 md:flex md:items-baseline md:justify-between md:gap-4">
        <h3 className="font-display text-sm uppercase leading-tight tracking-wide transition-colors group-hover:text-gold">
          <Link href={`/store/${product.slug}`}>{product.title}</Link>
        </h3>
        <span className="mt-1.5 block text-sm text-ink/60 tabular-nums md:mt-0 md:shrink-0">
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
