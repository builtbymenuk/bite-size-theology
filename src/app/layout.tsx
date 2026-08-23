import type { Metadata } from "next";
import { Fraunces, Inter, Cinzel } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Navbar from "@/components/layout/Navbar";
import PageBackground from "@/components/layout/PageBackground";
import { CartProvider } from "@/lib/cart";
import CartDrawer from "@/components/store/CartDrawer";
import CustomCursor from "@/components/layout/CustomCursor";
import { getNav, getThemeColors } from "@/lib/cms";

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

// Aileron — the actual typeface from the client's logo, so the wordmark matches the brand exactly
// rather than approximating it with a Google font. Not on Google Fonts; self-hosted from the
// designer's own CC0 mirror (github.com/reinhart1010/aileron), ~13KB per weight.
//
// Black Italic is a REAL italic, which is why nothing here skews: the previous stand-ins had no
// italic face, so the lean had to be faked with skewX. Drawn italics beat sheared uprights.
const lockup = localFont({
  src: [
    { path: "./fonts/Aileron-Black.woff2", weight: "900", style: "normal" },
    { path: "./fonts/Aileron-BlackItalic.woff2", weight: "900", style: "italic" },
  ],
  variable: "--font-aileron",
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
  const [nav, theme] = await Promise.all([getNav(), getThemeColors()]);
  // Override the Tailwind @theme tokens at runtime from the CMS. Inline on <html> beats the
  // :root defaults and cascades to every var()-based utility (incl. opacity variants). Legacy
  // token names kept (cream=paper, gold=accent, charcoal=dark section).
  const themeVars = {
    "--color-cream": theme.paper,
    "--color-ink": theme.ink,
    "--color-gold": theme.accent,
    "--color-charcoal": theme.darkSection,
    "--color-blue": theme.blue,
  } as React.CSSProperties;
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${wordmark.variable} ${lockup.variable}`}
      style={themeVars}
    >
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
