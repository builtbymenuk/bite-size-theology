import Link from "next/link";
import Placeholder from "@/components/ui/Placeholder";
import Reveal from "@/components/ui/Reveal";
import { formatPostDate } from "@/lib/blog";
import type { Post } from "@/lib/content";

// One line of the reading index. Shared by the ledger on /blog and the "Keep reading" strip at
// the foot of an article, which is why the hover handlers are props rather than local state —
// only the ledger owns the cursor-tracked cover preview.
//
// Two shapes, one markup: a thumbnail-left card on phones, a numbered ledger row from `md`.
// Exactly one of the column-1 children is in flow at each breakpoint.
export default function PostRow({
  post,
  index,
  onEnter,
  onLeave,
}: {
  post: Post;
  index: number;
  onEnter?: (e: React.MouseEvent) => void;
  onLeave?: () => void;
}) {
  const meta = [formatPostDate(post.date), `${post.readMinutes} min`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Reveal>
      <Link
        href={`/blog/${post.slug}`}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className="group grid grid-cols-[5rem_1fr] items-center gap-5 border-t border-ink/12 px-2 py-6 transition-colors duration-300 hover:bg-ink/[0.03] md:grid-cols-[4rem_1fr_auto] md:items-baseline md:gap-x-6 md:py-7"
      >
        {/* Phones don't get the hover preview, so the cover comes to them inline instead. */}
        <div className="grain relative aspect-[4/5] w-20 overflow-hidden rounded-xl md:hidden">
          <Placeholder src={post.cover} tone="light" sizes="80px" alt="" />
        </div>
        <span className="hidden font-display text-sm tabular-nums text-ink/30 md:block">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0">
          {post.scripture ? (
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold">
              {post.scripture}
            </p>
          ) : null}
          <h2 className="mt-1.5 font-display text-2xl leading-[1.1] tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:text-[2.75rem] md:leading-[1.05] md:group-hover:translate-x-2">
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/55 md:hidden">
              {post.excerpt}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-ink/40 md:hidden">
            {meta}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-5 md:flex">
          <span className="text-[11px] uppercase tracking-[0.2em] text-ink/40">{meta}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink/50 transition-colors duration-300 group-hover:border-ink group-hover:text-ink">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              <path
                d="M2 8h11M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
