// Runnable blog-helper check — no test framework:
//   node --experimental-strip-types src/lib/blog.check.ts
import assert from "node:assert/strict";
import { countWords, readMinutes, formatPostDate } from "./blog.ts";

// A realistic slice of a Strapi 5 `blocks` value: paragraphs with marks, a heading, a nested
// list, a quote, and an image. The image contributes no words — an alt text isn't reading time.
const body = [
  {
    type: "paragraph",
    children: [
      { type: "text", text: "Paul's whole argument turns " },
      { type: "text", text: "here", bold: true },
      { type: "text", text: "." },
    ],
  },
  { type: "heading", level: 2, children: [{ type: "text", text: "No condemnation" }] },
  {
    type: "list",
    format: "unordered",
    children: [
      { type: "list-item", children: [{ type: "text", text: "one two" }] },
      { type: "list-item", children: [{ type: "text", text: "three" }] },
      // A sublist is a SIBLING of the list-items, not a child of one — Strapi validates it that
      // way and rejects the nested shape outright ("Inline node must be Text or Link"), so this
      // is the only shape that can reach us. Blocks.tsx folds it back into the previous <li>.
      {
        type: "list",
        format: "unordered",
        children: [{ type: "list-item", children: [{ type: "text", text: "four five" }] }],
      },
    ],
  },
  { type: "quote", children: [{ type: "text", text: "Therefore, now." }] },
  {
    type: "image",
    image: { url: "/uploads/x.jpg", alternativeText: "a b c d e", caption: "f g" },
    children: [{ type: "text", text: "" }],
  },
];

// 6 + 2 + 5 + 2 + 0 = 15. Nested list items count; the image's alt/caption do not.
// The 6 includes the bare "." leaf that follows the bold run — a mark boundary splits trailing
// punctuation into its own leaf, and it scores as a word. Left alone: it inflates a real article
// by well under a percent, and a 200wpm estimate is not worth more code than this.
assert.equal(countWords(body), 15);

// Links carry their own children rather than a `text` of their own.
assert.equal(
  countWords([
    {
      type: "paragraph",
      children: [
        { type: "text", text: "read " },
        { type: "link", url: "/about", children: [{ type: "text", text: "the story" }] },
      ],
    },
  ]),
  3,
);

// Whitespace-only and empty leaves are not words — Strapi emits them for blank lines.
assert.equal(countWords([{ type: "paragraph", children: [{ type: "text", text: "   " }] }]), 0);
assert.equal(countWords([]), 0);
assert.equal(countWords(undefined), 0);
assert.equal(countWords(null), 0);

// A one-line devotional still reads as "1 min" — never 0, which would look broken on the card.
assert.equal(readMinutes(body), 1);
assert.equal(readMinutes([]), 1);
assert.equal(readMinutes(undefined), 1);
// 600 words at 200wpm = 3 min.
const long = [
  { type: "paragraph", children: [{ type: "text", text: Array(600).fill("word").join(" ") }] },
];
assert.equal(readMinutes(long), 3);

// UTC, not local: Strapi sends a full timestamp, and formatting late-evening UTC in a western
// timezone would render the previous day on the server and this one in the browser.
assert.equal(formatPostDate("2026-03-04T23:30:00.000Z"), "Mar 4, 2026");
assert.equal(formatPostDate("2026-01-01T00:00:00.000Z"), "Jan 1, 2026");
// A missing or unparseable date is a blank line, not "Invalid Date".
assert.equal(formatPostDate(""), "");
assert.equal(formatPostDate(undefined), "");
assert.equal(formatPostDate("not a date"), "");

console.log("blog check: OK");
