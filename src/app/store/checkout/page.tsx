import type { Metadata } from "next";
import { getStore } from "@/lib/cms";
import { paypalConfigured } from "@/lib/paypal";
import { stripeConfigured } from "@/lib/stripe";
import Footer from "@/components/layout/Footer";
import Checkout from "@/components/store/Checkout";

export const metadata: Metadata = {
  title: "Checkout — Bite Size Theology",
};

export default async function CheckoutPage() {
  const store = await getStore();
  // Gate each gateway on the SAME check its server route uses, so we never render a button the
  // server can't service. (Only booleans cross to the client — no secret leaks.) The client also
  // needs NEXT_PUBLIC_PAYPAL_CLIENT_ID for the PayPal SDK; Checkout ANDs that in.
  const paypalEnabled = paypalConfigured();
  const stripeEnabled = stripeConfigured();
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-32 md:pt-40">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          Checkout
        </h1>
        <Checkout
          shippingFee={store.shippingFee}
          currency={store.currency}
          paypalEnabled={paypalEnabled}
          stripeEnabled={stripeEnabled}
        />
      </div>
      <Footer />
    </div>
  );
}
