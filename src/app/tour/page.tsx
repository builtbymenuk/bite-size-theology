import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Parallax from "@/components/ui/Parallax";
import Placeholder from "@/components/ui/Placeholder";
import TourDates from "@/components/sections/TourDates";
import { getTour } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Tour — Bite Size Theology",
  description: "Catch Caleb Griffith live. US, Australia & New Zealand tour dates.",
};

export default async function TourPage() {
  const tour = await getTour();
  const [us, anz] = tour.regions;

  return (
    // Transparent wrapper — the shared PageBackground (dark + blurred on /tour) shows through
    // behind the rows/images, which carry their own surfaces.
    <div className="min-h-screen text-cream">
      <section className="mx-auto max-w-7xl px-6 pt-28 md:pt-32">
        <Parallax className="aspect-[16/8] w-full rounded-[2rem] grayscale" amount={12}>
          <Placeholder tone="dark" label={tour.heroImage} src={tour.heroImageSrc} />
        </Parallax>
      </section>

      <TourDates region={us} />

      <section className="mx-auto max-w-7xl px-6 py-4">
        <Parallax className="aspect-[16/8] w-full rounded-[2rem] grayscale" amount={12}>
          <Placeholder tone="cool" label={tour.secondImage} src={tour.secondImageSrc} />
        </Parallax>
      </section>

      <TourDates region={anz} />

      <Footer />
    </div>
  );
}
