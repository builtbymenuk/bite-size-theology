// Self-check for the RSS parser. Run: npx tsx src/lib/youtube.test.ts
import assert from "node:assert";
import {
  parseYouTubeFeed,
  extractChannelId,
  extractPlaylistId,
  extractVideoId,
} from "./youtube";

const SAMPLE = `<?xml version="1.0"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <title>Channel</title>
  <entry>
    <yt:videoId>abc123DEF-_</yt:videoId>
    <title>Faith &amp; Hope #jesus</title>
    <link rel="alternate" href="https://www.youtube.com/shorts/abc123DEF-_"/>
    <media:group>
      <media:thumbnail url="https://i2.ytimg.com/vi/abc123DEF-_/hqdefault.jpg"/>
    </media:group>
  </entry>
  <entry>
    <yt:videoId>zzz999ghijk</yt:videoId>
    <title>Second &#39;video&#39;</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=zzz999ghijk"/>
  </entry>
</feed>`;

const vids = parseYouTubeFeed(SAMPLE);
assert.equal(vids.length, 2, "two entries parsed");
assert.equal(vids[0].videoId, "abc123DEF-_");
assert.equal(vids[0].title, "Faith & Hope #jesus", "entity + hashtag decoded");
assert.equal(vids[0].url, "https://www.youtube.com/shorts/abc123DEF-_", "shorts link preserved");
assert.equal(vids[0].thumbnail, "https://i.ytimg.com/vi/abc123DEF-_/hqdefault.jpg", "canonical thumb host");
assert.equal(vids[1].title, "Second 'video'", "numeric entity decoded");

// A feed header without entries → []
assert.deepEqual(parseYouTubeFeed("<feed><title>x</title></feed>"), []);

assert.equal(
  extractChannelId("https://www.youtube.com/channel/UC7VL8Ljt2f0luWz4HMkUGuw"),
  "UC7VL8Ljt2f0luWz4HMkUGuw",
  "id from channel URL",
);
assert.equal(extractChannelId("UC7VL8Ljt2f0luWz4HMkUGuw"), "UC7VL8Ljt2f0luWz4HMkUGuw", "bare id");
assert.equal(extractChannelId("@bitesizetheology"), null, "handle not resolved");
assert.equal(extractChannelId(""), null);

assert.equal(
  extractPlaylistId("https://www.youtube.com/playlist?list=PLabc123DEF_-456xyz"),
  "PLabc123DEF_-456xyz",
  "id from playlist URL",
);
assert.equal(
  extractPlaylistId("https://www.youtube.com/watch?v=abc12345678&list=PLabc123DEF_-456xyz"),
  "PLabc123DEF_-456xyz",
  "id from watch URL",
);
assert.equal(extractPlaylistId("  PLabc123DEF_-456xyz  "), "PLabc123DEF_-456xyz", "bare id, trimmed");
assert.equal(extractPlaylistId("https://www.youtube.com/playlist"), null, "no list param");
assert.equal(extractPlaylistId("PL<script>"), null, "rejects unsafe chars");
assert.equal(extractPlaylistId("PLshort"), null, "rejects too-short id");
assert.equal(extractPlaylistId("   "), null, "whitespace only");
assert.equal(extractPlaylistId(""), null);

assert.equal(extractVideoId("yuQabQ_4Nmc"), "yuQabQ_4Nmc", "bare video id");
assert.equal(
  extractVideoId("https://www.youtube.com/watch?v=yuQabQ_4Nmc&list=PLabc123DEF_-456xyz"),
  "yuQabQ_4Nmc",
  "id from watch URL",
);
assert.equal(
  extractVideoId("https://youtu.be/yuQabQ_4Nmc?si=AbCdEfGhIjKl"),
  "yuQabQ_4Nmc",
  "Share-button short link — the most likely paste from the admin",
);
assert.equal(
  extractVideoId("https://www.youtube.com/@cornerstonestatesville"),
  null,
  "channel URL is not a video",
);
assert.equal(extractVideoId("  yuQabQ_4Nmc  "), "yuQabQ_4Nmc", "trimmed");
assert.equal(extractVideoId("yuQabQ_4Nm"), null, "10 chars rejected");
assert.equal(extractVideoId("yuQabQ_4Nmcx"), null, "12 chars rejected");
assert.equal(extractVideoId("<script>abc"), null, "unsafe chars rejected");
assert.equal(extractVideoId(""), null);

console.log("youtube parse: OK");
