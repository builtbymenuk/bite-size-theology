import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Navbar from "@/components/layout/Navbar";
import PageBackground from "@/components/layout/PageBackground";
import { getNav } from "@/lib/cms";

// ponytail: Fraunces roman+italic covers both display serif and the gold script accent — one family, not two.
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
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-cream text-ink antialiased">
        <SmoothScroll>
          {/* Persistent, never transformed: background crossfades + nav stays fixed across route
              transitions. PageTransition owns the AnimatePresence enter/exit for the routed page. */}
          <PageBackground />
          <Navbar nav={nav} />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
