// Sliding-window request counter. Keys are namespaced by the caller (e.g. "nl:ip:1.2.3.4"), so
// different limits can share the map without colliding.
//
// ponytail: process-local Map. Production is one long-lived Node process (output: "standalone"
// under Passenger), so this is enough to stop form spam. It resets on restart/deploy and would
// count per-worker if Passenger were ever run with more than one. Swap the Map for a shared store
// (Redis, or a Strapi-backed counter) only when one of those stops being true.

const hits = new Map<string, number[]>();

// Guard against unbounded growth on a process that runs for weeks: once the map gets large, drop
// keys whose window has fully expired. O(n), but only on the rare call that crosses the threshold.
const MAX_KEYS = 5000;

function sweep(now: number, windowMs: number): void {
  for (const [k, ts] of hits) {
    if (!ts.length || ts[ts.length - 1] <= now - windowMs) hits.delete(k);
  }
}

// True = allowed (and the hit is recorded). False = over the limit; a blocked attempt is NOT
// recorded, so hammering the endpoint can't extend its own lockout indefinitely.
export function allow(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  if (hits.size > MAX_KEYS) sweep(now, windowMs);
  const cutoff = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  hits.set(key, recent);
  if (recent.length >= max) return false;
  recent.push(now);
  return true;
}

// The originating address, as best we can know it. x-forwarded-for is client-controlled and there
// is no trusted-proxy list to check it against — but spoofing it only moves the attacker to a
// different bucket, which is no worse than having no limit at all. A speed bump, not authentication.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown";
}
