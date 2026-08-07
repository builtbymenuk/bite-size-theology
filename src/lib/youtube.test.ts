// Self-check for the RSS parser. Run: npx tsx src/lib/youtube.test.ts
import assert from "node:assert";
import { parseYouTubeFeed, extractChannelId } from "./youtube";

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

console.log("youtube parse: OK");
