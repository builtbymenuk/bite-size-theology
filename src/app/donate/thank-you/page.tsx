export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
import DonateThankYou from "@/components/donate/DonateThankYou";
import { getDonate } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Thank You — Bite Size Theology",
};

export default async function DonateThankYouPage() {
  const donate = await getDonate();
  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Suspense: DonateThankYou reads useSearchParams (Stripe return), which Next 16 requires wrapped. */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <DonateThankYou heading={donate.thankYouHeading} body={donate.thankYouBody} />
      </Suspense>
      <Footer />
    </div>
  );
}
