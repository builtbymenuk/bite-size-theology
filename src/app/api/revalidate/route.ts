import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Cache tags == the content-type paths in cms.ts. A Strapi webhook (Settings → Webhooks)
// POSTs here on content changes so prod updates immediately instead of waiting out the ISR
// window. In dev this is a no-op (fetches are already uncached — see REVALIDATE in cms.ts).
const TAGS = [
  "nav", "hero", "eyebrow", "calling", "all-thing", "collection", "podcast",
  "podcast-page", "faq", "footer", "about", "contact", "book-caleb", "prayer", "theme-setting", "donate", "tour",
  "store", "products", "categories",
  "blog", "posts", "post-categories",
];

// Strapi posts the singularName ("product"); cms.ts tags the list fetch by pluralName ("products").
const ALIAS: Record<string, string> = {
  product: "products",
  category: "categories",
  post: "posts",
  "post-category": "post-categories",
};

export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, message: "invalid secret" }, { status: 401 });
  }

  // Strapi's webhook body carries the changed model (singularName, e.g. "hero"). Revalidate just
  // that tag when we recognize it, else refresh all.
  let model: string | undefined;
  try {
    model = (await req.json())?.model;
  } catch {
    // no/invalid body → fall through to revalidating everything
  }
  const resolved = model ? (ALIAS[model] ?? model) : undefined;
  const tags = resolved && TAGS.includes(resolved) ? [resolved] : TAGS;
  for (const tag of tags) revalidateTag(tag, "max"); // Next 16 requires the 2nd (cacheLife) arg

  return NextResponse.json({ ok: true, revalidated: tags });
}
