// Render per-request: the wall's pray-counts change, and CMS edits should show on reload.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/ui/Reveal";
import PrayerForm from "@/components/sections/PrayerForm";
import { getPrayer } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Prayer Request — Bite Size Theology",
  description:
    "Share a prayer request with our team. Whatever you're carrying, you don't have to carry it alone.",
};

export default async function PrayerPage() {
  const page = await getPrayer();
  return (
    // Cream wrapper covers the shared PageBackground; navbar pins its light pill on /prayer.
    <div className="min-h-screen bg-cream text-ink">
      <section className="mx-auto max-w-7xl px-6 pt-28 md:pt-32">
        <Reveal>
          <h1 className="font-display text-6xl leading-[0.95] tracking-tight md:text-7xl lg:text-[5.25rem]">
            {page.headingLead}{" "}
            <span className="italic text-gold">{page.headingScript}</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">{page.intro}</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <Reveal className="mx-auto max-w-2xl">
          <PrayerForm form={page.form} privacyNote={page.privacyNote} assurance={page.assurance} />
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
