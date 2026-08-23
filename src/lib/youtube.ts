// Pulls a channel's latest videos from YouTube's public RSS feed — no API key, no quota.
// Feeds the podcast "episode wall" (see getPodcast in cms.ts). On ANY failure (bad id, network,
// non-200, timeout, parse) it returns [] so the wall falls back to CMS episodes, then tones.

export type YtVideo = {
  videoId: string;
  title: string;
  url: string; // watch/shorts link — the tile becomes a clickable <a>
  thumbnail: string;
};

// Videos change rarely; cache an hour (even in dev) so we don't hammer the feed on every reload.
const YT_REVALIDATE = Number(process.env.YOUTUBE_REVALIDATE) || 3600;

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'",
};
function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X"
        ? parseInt(code.slice(2), 16)
        : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code] ?? m;
  });
}

// Accept a bare UC… id OR any URL/string containing /channel/UC… — returns the id or null.
// (An @handle is NOT resolvable here without an extra network hop; paste the UC id or channel URL.)
export function extractChannelId(input?: string): string | null {
  if (!input) return null;
  return input.match(/UC[A-Za-z0-9_-]{22}/)?.[0] ?? null;
}

// Accept a full playlist/watch URL (…?list=PL…) or a bare id. Also the sanitizer for the embed
// src — the value is admin-pasted, so anything outside [A-Za-z0-9_-] returns null and the caller
// renders nothing. Trims too: cms.ts's `d.x || fb.x` doesn't, and "  " would otherwise pass.
export function extractPlaylistId(input?: string): string | null {
  if (!input) return null;
  const s = input.trim();
  const id = s.match(/[?&]list=([A-Za-z0-9_-]+)/)?.[1] ?? s;
  return /^[A-Za-z0-9_-]{12,}$/.test(id) ? id : null;
}

// Admin-pasted ids land in an iframe src and an i.ytimg URL, so sanitize like the two above:
// a bare 11-char id or any URL YouTube's own UI hands out — watch?v=, the Share button's
// youtu.be/… short link, /shorts/ and /live/ — else null and the caller renders nothing.
export function extractVideoId(input?: string): string | null {
  if (!input) return null;
  const s = input.trim();
  const id = s.match(/(?:[?&]v=|youtu\.be\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/)?.[1] ?? s;
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

// Pure: parse the Atom feed XML into videos. Exported for the self-check.
// Regex-parses the stable YouTube Atom feed; swap to fast-xml-parser only if that format changes.
export function parseYouTubeFeed(xml: string): YtVideo[] {
  const out: YtVideo[] = [];
  for (const entry of xml.split("<entry>").slice(1)) {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    if (!videoId) continue;
    const rawTitle = entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    const link = entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1];
    out.push({
      videoId,
      title: decodeEntities(rawTitle),
      url: link || `https://www.youtube.com/watch?v=${videoId}`,
      // Canonical thumbnail host (feed uses i2/i9.ytimg.com; this always resolves) so one
      // next.config remotePattern covers every video.
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    });
  }
  return out;
}

export async function getYouTubeVideos(channelId?: string, limit = 15): Promise<YtVideo[]> {
  const id = extractChannelId(channelId);
  if (!id) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000); // never block SSR on a slow feed
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`,
      { signal: controller.signal, next: { revalidate: YT_REVALIDATE, tags: ["youtube"] } },
    );
    if (!res.ok) return [];
    return parseYouTubeFeed(await res.text()).slice(0, limit);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
