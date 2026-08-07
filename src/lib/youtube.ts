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

// Pure: parse the Atom feed XML into videos. Exported for the self-check.
// ponytail: regex-parse the stable YouTube Atom feed; swap to fast-xml-parser only if it changes.
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
