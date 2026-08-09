// Render per-request against live Strapi (CMS edits show on reload; also avoids baking
// fallback content when Strapi is unreachable at build time).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Reveal, { RevealItem } from "@/components/ui/Reveal";
import BookCalebForm from "@/components/sections/BookCalebForm";
import { getBookCaleb } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Book Caleb — Bite Size Theology",
  description:
    "Invite Caleb to speak at your conference, service, retreat, or event. Send us the details and our team will follow up.",
};

const label = "text-[11px] uppercase tracking-[0.3em] text-ink/50";

export default async function BookCalebPage() {
  const page = await getBookCaleb();
  return (
    // Cream wrapper covers the shared PageBackground; navbar pins its light pill on /book-caleb.
    <div className="min-h-screen bg-cream text-ink">
      <section className="mx-auto max-w-7xl px-6 pt-28 md:pt-32">
        <Reveal>
          <h1 className="font-display text-6xl leading-[0.95] tracking-tight md:text-7xl lg:text-[5.25rem]">
            {page.headingLead}{" "}
            <span className="italic text-gold">{page.headingScript}</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">
            {page.intro}
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.5fr]">
          {/* Left — what to expect */}
          <Reveal stagger className="flex flex-col gap-10">
            <RevealItem className="border-t border-ink/10 pt-6">
              <p className={label}>What to expect</p>
              <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-ink/70">
                {/* clock */}
                <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-ink/50" aria-hidden>
                  <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.1" />
                  <path
                    d="M8 4.5V8l2.5 1.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                </svg>
                {page.responseNote}
              </p>
            </RevealItem>

            <RevealItem className="border-t border-ink/10 pt-6">
              <p className={label}>{page.directEmail.label}</p>
              <a
                href={`mailto:${page.directEmail.address}`}
                className="mt-4 block text-lg text-ink transition-colors hover:text-gold"
              >
                {page.directEmail.address}
              </a>
            </RevealItem>
          </Reveal>

          {/* Right — form */}
          <Reveal>
            <BookCalebForm form={page.form} />
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
