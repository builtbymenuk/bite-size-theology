import Reveal from "@/components/ui/Reveal";
import ListenWatch from "@/components/ui/ListenWatch";
import { getPodcast, getPodcastPage } from "@/lib/cms";

// Above-the-fold: use Reveal (fade+move), not MaskReveal — the transform-only line-wipe can leave
// the title clipped when it's already in view at mount.
export default async function PodcastHero() {
  const [podcastPage, podcast] = await Promise.all([getPodcastPage(), getPodcast()]);
  const { hero } = podcastPage;
  return (
    <section className="mx-auto max-w-7xl px-6 pt-36 pb-16 md:pt-44 md:pb-24">
      <Reveal>
        <h1 className="max-w-2xl font-display text-[clamp(2.75rem,7vw,5.25rem)] font-light leading-[0.95] tracking-tight text-ink">
          <span className="block">{hero.name}</span>
          <span className="block">
            {hero.heading}{" "}
            <span className="italic text-gold">{hero.headingAccent}</span>
          </span>
        </h1>
      </Reveal>

      <Reveal className="mt-8 max-w-md">
        <p className="text-sm leading-relaxed text-ink/60">{hero.subtext}</p>
        <ListenWatch
          actions={podcast.actions}
          youtubeUrl={
            podcast.youtubeChannelId
              ? `https://www.youtube.com/channel/${podcast.youtubeChannelId}`
              : undefined
          }
          className="mt-8"
        />
      </Reveal>
    </section>
  );
}
