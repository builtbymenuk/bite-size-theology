import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import EyebrowStrip from "@/components/sections/EyebrowStrip";
import Calling from "@/components/sections/Calling";
import AllThings from "@/components/sections/AllThings";
import Collection from "@/components/sections/Collection";
import Podcast from "@/components/sections/Podcast";
import Faq from "@/components/sections/Faq";
import { getHero, getPodcast } from "@/lib/cms";

export default async function Home() {
  const [hero, podcast] = await Promise.all([getHero(), getPodcast()]);
  return (
    <>
      {/* Stacking scroll: the hero pins (sticky) and everything below rises up and
          covers it — the rounded top + upward shadow sell the "slides over" seam.
          pure CSS position:sticky — no scroll library needed. */}
      <div className="sticky top-0 z-0 h-[100svh]">
        <Hero hero={hero} />
      </div>

      <div className="relative z-10 overflow-hidden bg-cream shadow-[0_-24px_60px_-12px_rgba(0,0,0,0.35)]">
        <main>
          <EyebrowStrip />
          <Calling />
          <AllThings />
          <Collection />
          <Podcast podcast={podcast} />
          <Faq />
        </main>
        <Footer />
      </div>
    </>
  );
}
