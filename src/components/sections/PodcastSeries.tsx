import SeriesWall, { type SeriesCardData } from "@/components/sections/SeriesWall";
import { getPodcastPage } from "@/lib/cms";
import { extractPlaylistId, extractVideoId } from "@/lib/youtube";

// Caleb's preaching series on the CHURCH's channel, below the personal-channel wall. Stays a
// server component so the getPodcastPage() seam and the id sanitizing happen before any client JS;
// the interactive wall (posters, hover preview, lightbox) lives in SeriesWall.
//
// Junk ids would land in an iframe src / image URL, so they're stripped here. A row whose video
// doesn't resolve isn't dropped — it becomes an empty frame on the wall, which is how an editor reserves
// a slot for a series that hasn't been filmed yet.
export default async function PodcastSeries() {
  const { series } = await getPodcastPage();

  const cards: SeriesCardData[] = series.items.map((c) => ({
    title: c.title,
    note: c.note,
    videoId: extractVideoId(c.video),
    playlistId: extractPlaylistId(c.playlist),
  }));

  const posters = cards.filter((c) => c.videoId);
  const placeholders = cards.filter((c) => !c.videoId);

  // Nothing but placeholders isn't a section worth rendering.
  if (!series.visible || !posters.length) return null;

  return <SeriesWall series={series} posters={posters} placeholders={placeholders} />;
}
