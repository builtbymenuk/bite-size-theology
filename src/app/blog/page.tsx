// Render per-request against live Strapi (CMS edits show on reload; also avoids baking
// fallback content when Strapi is unreachable at build time).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/ui/Reveal";
import PostIndex from "@/components/blog/PostIndex";
import { getBlog, getPosts, getPostCategories } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Blog — Bite Size Theology",
  description:
    "Short readings and longer studies from Pastor Caleb Griffith — theology broken down for the everyday believer.",
};

export default async function BlogPage() {
  const [blog, posts, categories] = await Promise.all([
    getBlog(),
    getPosts(),
    getPostCategories(),
  ]);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-28 md:pt-32">
        <Reveal className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{blog.eyebrow}</p>
          <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-tight">
            {blog.headingLead} <span className="italic text-gold">{blog.headingScript}</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink/60">{blog.intro}</p>
        </Reveal>

        <div className="mt-14 md:mt-20">
          <PostIndex blog={blog} posts={posts} categories={categories} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
