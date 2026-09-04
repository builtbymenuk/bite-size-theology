import Link from "next/link";
import Placeholder from "@/components/ui/Placeholder";
import { absolutize } from "@/lib/cms";
import Reveal from "@/components/ui/Reveal";

// Renders Strapi 5's `blocks` field — a small JSON AST — as the article body.
//
// ponytail: hand-rolled instead of @strapi/blocks-react-renderer. That package would still need a
// custom image block to route uploads through next/image + Placeholder, so it buys a dependency
// and saves maybe twenty lines. Swap to it if the AST grows past what's handled here.

type Leaf = {
  type?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  url?: string;
  children?: Leaf[];
};

type Block = Leaf & {
  type?: string;
  level?: number;
  format?: "ordered" | "unordered";
  image?: { url?: string; alternativeText?: string; caption?: string };
};

/** Inline run: text with marks, plus links (which carry their own children). */
function Inline({ nodes }: { nodes?: Leaf[] }) {
  if (!nodes?.length) return null;
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === "link") {
          return (
            // Editors paste both absolute and site-relative URLs; Link handles either, and an
            // external one opens in a new tab so the article stays put.
            <Link
              key={i}
              href={n.url ?? "#"}
              {...(/^https?:\/\//i.test(n.url ?? "")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="text-blue underline decoration-blue/30 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink/40"
            >
              <Inline nodes={n.children} />
            </Link>
          );
        }
        if (typeof n.text !== "string") return <Inline key={i} nodes={n.children} />;
        // Empty leaf = the editor's blank line. Keep it out of the DOM rather than emitting a
        // stray <strong></strong>.
        if (!n.text) return null;
        let el: React.ReactNode = n.text;
        if (n.code) el = <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 text-[0.9em]">{el}</code>;
        if (n.bold) el = <strong className="font-semibold text-ink">{el}</strong>;
        if (n.italic) el = <em>{el}</em>;
        if (n.underline) el = <u>{el}</u>;
        if (n.strikethrough) el = <s>{el}</s>;
        return <span key={i}>{el}</span>;
      })}
    </>
  );
}

const HEADINGS: Record<number, string> = {
  1: "mt-16 mb-5 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl",
  2: "mt-14 mb-4 font-display text-3xl leading-[1.1] tracking-tight md:text-4xl",
  3: "mt-10 mb-3 font-display text-2xl leading-[1.15] tracking-tight md:text-3xl",
  4: "mt-8 mb-2 font-display text-xl tracking-tight",
  5: "mt-8 mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-ink/50",
  6: "mt-8 mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-ink/40",
};

/** Nested lists arrive as a list-item whose children include another list. */
function ListItems({ items }: { items?: Block[] }) {
  // Strapi stores a sublist as a SIBLING of the list-items it belongs under, not inside one —
  // its own validator rejects a list nested in a list-item ("Inline node must be Text or Link").
  // Valid HTML wants it inside the preceding <li>, so fold it in before rendering.
  const rows: { item: Block; subs: Block[] }[] = [];
  for (const node of items ?? []) {
    if (node.type === "list" && rows.length) rows[rows.length - 1].subs.push(node);
    else rows.push({ item: node, subs: [] });
  }
  return (
    <>
      {rows.map(({ item, subs }, i) => (
        <li key={i} className="pl-1">
          <Inline nodes={item.children} />
          {subs.map((sub, j) => (
            <BlockNode key={j} block={sub} />
          ))}
        </li>
      ))}
    </>
  );
}

function BlockNode({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const level = Math.min(Math.max(block.level ?? 2, 1), 6);
      const Tag = `h${level}` as "h1";
      return (
        <Tag className={HEADINGS[level]}>
          <Inline nodes={block.children} />
        </Tag>
      );
    }

    case "list": {
      const ordered = block.format === "ordered";
      const Tag = ordered ? "ol" : "ul";
      return (
        <Tag
          // The descendant rules tighten sublists — a nested list keeping the full my-6 would
          // open a gap inside its own bullet.
          className={`my-6 space-y-2 pl-6 text-[1.0625rem] leading-[1.75] text-ink/75 marker:text-gold [&_ol]:mb-0 [&_ol]:mt-2 [&_ul]:mb-0 [&_ul]:mt-2 ${
            ordered ? "list-decimal" : "list-disc"
          }`}
        >
          <ListItems items={block.children as Block[]} />
        </Tag>
      );
    }

    case "quote":
      return (
        <blockquote className="my-10 border-l-2 border-gold pl-6 font-display text-xl italic leading-[1.5] text-ink md:text-2xl">
          <Inline nodes={block.children} />
        </blockquote>
      );

    case "code":
      return (
        <pre className="my-8 overflow-x-auto rounded-2xl bg-ink p-6 text-[0.8125rem] leading-relaxed text-cream/90">
          <code>
            {(block.children ?? []).map((c) => c.text ?? "").join("")}
          </code>
        </pre>
      );

    case "image": {
      const img = block.image;
      if (!img?.url) return null;
      return (
        <Reveal className="my-12">
          <figure>
            {/* Breaks the reading measure on desktop so a photo lands with some weight; the
                grain matches the image treatment used across the rest of the site. */}
            <div className="grain relative aspect-[16/10] overflow-hidden rounded-2xl lg:-mx-16">
              <Placeholder
                src={absolutize(img.url)}
                alt={img.alternativeText ?? ""}
                tone="light"
                sizes="(min-width: 1024px) 780px, 100vw"
              />
            </div>
            {img.caption ? (
              <figcaption className="mt-3 text-[11px] uppercase tracking-[0.2em] text-ink/40 lg:-mx-16">
                {img.caption}
              </figcaption>
            ) : null}
          </figure>
        </Reveal>
      );
    }

    case "paragraph": {
      // Strapi emits an empty paragraph for a blank line; rendering it adds phantom spacing.
      const empty = (block.children ?? []).every((c) => !c.text?.trim() && c.type !== "link");
      if (empty) return null;
      return (
        <p className="text-[1.0625rem] leading-[1.75] text-ink/75 [&+p]:mt-6">
          <Inline nodes={block.children} />
        </p>
      );
    }

    default:
      // Unknown block from a future Strapi version — render its text rather than dropping it.
      return block.children ? (
        <p className="text-[1.0625rem] leading-[1.75] text-ink/75 [&+p]:mt-6">
          <Inline nodes={block.children} />
        </p>
      ) : null;
  }
}

export default function Blocks({ value }: { value: unknown }) {
  if (!Array.isArray(value) || !value.length) return null;
  return (
    <div className="font-body">
      {value.map((b, i) => (
        <BlockNode key={i} block={b as Block} />
      ))}
    </div>
  );
}
