import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getProduct, getProducts, getStore } from "@/lib/cms";
import { formatUSD } from "@/lib/pricing";
import { toneFor } from "@/components/store/tone";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/ui/Reveal";
import ProductGallery from "@/components/store/ProductGallery";
import AddToCart from "@/components/store/AddToCart";
import ProductRow from "@/components/store/ProductRow";

// Next 16: params is a Promise — await it.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found — Bite Size Theology" };
  return {
    title: `${product.title} — Bite Size Theology`,
    description: product.description?.slice(0, 160) || undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Shop closed: a stale link or a bookmark must not reach a buy button (see store.comingSoon).
  if ((await getStore()).comingSoon) redirect("/store");

  const product = await getProduct(slug);
  if (!product) notFound();

  const others = (await getProducts())
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 md:pt-40">
        <Reveal>
          <nav className="text-[11px] uppercase tracking-[0.2em] text-ink/40">
            <Link href="/store" className="transition-colors hover:text-ink">
              Shop
            </Link>
            <span className="px-2">/</span>
            <span className="text-ink/70">{product.title}</span>
          </nav>
        </Reveal>

        <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <ProductGallery
              images={product.images}
              tone={toneFor(product.slug)}
              title={product.title}
            />
          </Reveal>

          <Reveal className="md:py-6">
            {product.badge && !product.soldOut ? (
              <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
                {product.badge}
              </p>
            ) : null}
            <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight md:text-5xl">
              {product.title}
            </h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl tabular-nums">
                {formatUSD(product.price)}
              </span>
              {product.compareAtPrice ? (
                <span className="text-lg text-ink/35 line-through tabular-nums">
                  {formatUSD(product.compareAtPrice)}
                </span>
              ) : null}
            </div>
            {product.description ? (
              <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/70">
                {product.description}
              </p>
            ) : null}

            <AddToCart product={product} />

            <p className="mt-8 border-t border-ink/10 pt-6 text-xs leading-relaxed text-ink/50">
              Ships in 3–5 business days · Free returns within 30 days · 10% of
              proceeds support mission work.
            </p>
          </Reveal>
        </div>
      </div>

      <ProductRow heading="You May Also Like" products={others} />
      <Footer />
    </div>
  );
}
