// Render per-request against live Strapi (CMS edits show on reload; also avoids baking
// fallback content when Strapi is unreachable at build time).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import PodcastHero from "@/components/sections/PodcastHero";
import Podcast from "@/components/sections/Podcast";
import PodcastStats from "@/components/sections/PodcastStats";
import PodcastCta from "@/components/sections/PodcastCta";
import { getPodcast } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Podcast — Bite Size Theology",
  description:
    "Join Pastor Caleb Griffith as he unpacks profound theological truths into accessible, everyday wisdom. New episodes every Wednesday.",
};

export default async function PodcastPage() {
  const podcast = await getPodcast();
  return (
    <div className="min-h-screen bg-cream text-ink">
      <main>
        <PodcastHero />
        <Podcast podcast={podcast} />
        <PodcastStats />
        <PodcastCta />
      </main>
      <Footer />
    </div>
  );
}
