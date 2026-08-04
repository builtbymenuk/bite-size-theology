import type { Metadata } from "next";
import { Fraunces, Inter, Cinzel } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Navbar from "@/components/layout/Navbar";
import PageBackground from "@/components/layout/PageBackground";
import { CartProvider } from "@/lib/cart";
import CartDrawer from "@/components/store/CartDrawer";
import CustomCursor from "@/components/layout/CustomCursor";
import { getNav } from "@/lib/cms";

// Fraunces roman+italic covers both display serif and the gold script accent — one family, not two.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Cinzel just for the big "Bite Size Theology" wordmark (hero + footer) — a distinct
// logotype. Roman inscriptional caps, no italic; the gold script accents stay on Fraunces.
const wordmark = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bite Size Theology",
  description:
    "Honest, unfiltered conversations about faith, culture, and the Bible. Welcome to Bite Size Theology.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nav = await getNav();
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${wordmark.variable}`}>
      {/* suppressHydrationWarning: browser extensions (ColorZilla, Grammarly, etc.) inject
          attributes on <body> before React hydrates, tripping a false dev hydration error. */}
      <body className="bg-cream text-ink antialiased" suppressHydrationWarning>
        <SmoothScroll>
          {/* Persistent, never transformed: background crossfades + nav stays fixed across route
              transitions. PageTransition owns the AnimatePresence enter/exit for the routed page. */}
          <CartProvider>
            <PageBackground />
            <Navbar nav={nav} />
            {children}
            <CartDrawer />
            <CustomCursor />
          </CartProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
