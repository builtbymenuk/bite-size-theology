// Render per-request against live Strapi, same as every other page — a freshly published
// article shows on the next reload rather than waiting out the ISR window.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Parallax from "@/components/ui/Parallax";
import Placeholder from "@/components/ui/Placeholder";
import Reveal from "@/components/ui/Reveal";
import Blocks from "@/components/blog/Blocks";
import PostRow from "@/components/blog/PostRow";
import ReadingProgress from "@/components/blog/ReadingProgress";
import { formatPostDate } from "@/lib/blog";
import { getBlog, getPost, getPosts } from "@/lib/cms";

// Next 16: params is a Promise — await it.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found — Bite Size Theology" };
  return {
    title: `${post.title} — Bite Size Theology`,
    description: post.excerpt?.slice(0, 160) || undefined,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, blog, all] = await Promise.all([getPost(slug), getBlog(), getPosts()]);
  if (!post) notFound();

  const others = all.filter((p) => p.slug !== post.slug).slice(0, 3);
  const date = formatPostDate(post.date);

  // The study-Bible margin: the facts you want in view while you read, not just at the top.
  const rail: [string, string][] = [
    ...(post.scripture ? ([["Scripture", post.scripture]] as [string, string][]) : []),
    ...(date ? ([["Published", date]] as [string, string][]) : []),
    ["Reading time", `${post.readMinutes} min`],
    ...(post.category ? ([["Filed under", post.category.name]] as [string, string][]) : []),
    ["Written by", post.author],
  ];

  return (
    <div className="min-h-screen bg-cream text-ink">
      <ReadingProgress />

      <main>
        {/* 86svh, not 100: the navbar flips from frosted to cream past `innerHeight - 90`, so a
            hero just under one viewport hands the bar over right at the seam. */}
        <header className="relative flex h-[86svh] items-end overflow-hidden">
          {/* The wrapper is load-bearing: Parallax hardcodes `relative` on its own box, and
              `.relative` outranks `.absolute` in Tailwind's cascade whatever order the classes
              are written in — so positioning it directly collapses it to zero height. Every
              other caller (about, tour) sizes it with an aspect ratio instead. */}
          <div className="absolute inset-0">
            <Parallax className="grain h-full w-full" amount={10}>
              <Placeholder src={post.cover} tone="dark" alt="" sizes="100vw" />
            </Parallax>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/10" />
          <div className="relative mx-auto w-full max-w-7xl px-6 pb-14 md:pb-20">
            <Reveal className="max-w-4xl">
              <Link
                href="/blog"
                className="text-[11px] uppercase tracking-[0.22em] text-cream/60 transition-colors hover:text-cream"
              >
                ← {blog.headingLead} {blog.headingScript}
              </Link>
              {post.scripture ? (
                <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-gold">
                  {post.scripture}
                </p>
              ) : null}
              <h1 className="mt-4 font-display text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.98] tracking-tight text-cream">
                {post.title}
              </h1>
              <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-cream/75">
                {[post.author, date, `${post.readMinutes} min read`].filter(Boolean).join(" · ")}
              </p>
            </Reveal>
          </div>
        </header>

        <article className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:py-28 lg:grid-cols-[13rem_minmax(0,68ch)] lg:gap-16">
          {/* Hidden below lg — the hero already carries all of it on a phone. */}
          <aside className="hidden self-start lg:sticky lg:top-28 lg:block">
            <dl>
              {rail.map(([label, value]) => (
                <div key={label} className="border-t border-ink/12 py-3">
                  <dt className="text-[10px] uppercase tracking-[0.22em] text-ink/35">{label}</dt>
                  <dd className="mt-1 text-sm leading-snug text-ink/70">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>

          <div>
            {post.excerpt ? (
              <p className="mb-10 font-display text-xl leading-[1.5] text-ink/80 md:text-2xl">
                {post.excerpt}
              </p>
            ) : null}
            <Blocks value={post.body} />
          </div>
        </article>

        {others.length ? (
          <section className="mx-auto max-w-7xl px-6 pb-24">
            <Reveal>
              <h2 className="font-display text-3xl tracking-tight md:text-4xl">
                {blog.keepReadingHeading}
              </h2>
            </Reveal>
            <div className="mt-8">
              {others.map((p, i) => (
                <PostRow key={p.slug} post={p} index={i} />
              ))}
              <div className="border-t border-ink/12" />
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
