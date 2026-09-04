// Blog helpers shared by the CMS seam and the two blog routes. Kept out of cms.ts so
// blog.check.ts can import them without dragging in next/cache and the fetch layer.

/**
 * Words in a Strapi `blocks` AST. Walks arrays, `children`, and leaf `{ type: "text", text }`
 * nodes; every other key (image, code, link attrs) contributes nothing, which is what we want —
 * an image caption isn't reading time.
 */
export const countWords = (node: unknown): number => {
  if (Array.isArray(node)) return node.reduce<number>((sum, child) => sum + countWords(child), 0);
  if (node === null || typeof node !== "object") return 0;
  const n = node as { text?: unknown; children?: unknown };
  if (typeof n.text === "string") return n.text.trim().split(/\s+/).filter(Boolean).length;
  return countWords(n.children);
};

/** Reading time in whole minutes, never zero — a one-line devotional still says "1 min". */
export const readMinutes = (body: unknown): number =>
  Math.max(1, Math.round(countWords(body) / 200)); // 200 wpm, the usual prose estimate

/**
 * "Mar 4, 2026". Forced to UTC so the server render and the client hydration agree — Strapi
 * sends a full ISO timestamp, and formatting it in local time flips the day either side of
 * midnight. Returns "" for a missing/unparseable date so callers can just skip the line.
 */
export function formatPostDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
