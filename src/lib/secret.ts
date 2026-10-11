import { createHash, timingSafeEqual } from "node:crypto";

// Constant-time check of a shared secret (webhook/sync query params). `!==` returns as soon as a
// character differs, which leaks how much of a guess was right through response timing. Hashing
// both sides first gives equal-length buffers, so the length doesn't leak either. An unset
// `expected` never matches — an unconfigured secret must lock the endpoint, not open it.
export function secretMatches(given: string | null | undefined, expected: string | undefined): boolean {
  if (!expected || !given) return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
