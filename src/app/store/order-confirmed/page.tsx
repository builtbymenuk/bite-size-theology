import type { Metadata } from "next";
import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
import OrderConfirmed from "@/components/store/OrderConfirmed";

export const metadata: Metadata = {
  title: "Order Confirmed — Bite Size Theology",
};

export default function OrderConfirmedPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Suspense: OrderConfirmed reads useSearchParams (Stripe return), which Next 16 requires be wrapped. */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <OrderConfirmed />
      </Suspense>
      <Footer />
    </div>
  );
}
