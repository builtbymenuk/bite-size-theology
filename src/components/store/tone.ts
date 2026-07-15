import type { Tone } from "@/lib/content";

// Deterministic placeholder color for a product with no uploaded image, so the catalog still
// looks intentional (and stable across reloads/grid reflows) instead of all-grey.
const TONES: Tone[] = ["light", "cool", "warm", "gold", "yellow", "dark"];

export function toneFor(seed: string): Tone {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
