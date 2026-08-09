// Render per-request against live Strapi (CMS edits show on reload; also avoids baking
// fallback content when Strapi is unreachable at build time).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Reveal, { RevealItem } from "@/components/ui/Reveal";
import ContactForm from "@/components/sections/ContactForm";
import { getContact } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Contact — Bite Size Theology",
  description:
    "Questions about the ministry, speaking requests, or a prayer need — reach out to Bite Size Theology.",
};

const label = "text-[11px] uppercase tracking-[0.3em] text-ink/50";

export default async function ContactPage() {
  const contact = await getContact();
  return (
    // Cream wrapper covers the shared PageBackground; navbar pins its light pill on /contact.
    <div className="min-h-screen bg-cream text-ink">
      <section className="mx-auto max-w-7xl px-6 pt-28 md:pt-32">
        <Reveal>
          <h1 className="font-display text-6xl leading-[0.95] tracking-tight md:text-7xl lg:text-[5.25rem]">
            {contact.headingLead}{" "}
            <span className="italic text-gold">{contact.headingScript}</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">
            {contact.intro}
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.5fr]">
          {/* Left — contact info */}
          <Reveal stagger className="flex flex-col gap-10">
            <RevealItem className="border-t border-ink/10 pt-6">
              <p className={label}>{contact.email.label}</p>
              <a
                href={`mailto:${contact.email.address}`}
                className="mt-4 block text-lg text-ink transition-colors hover:text-gold"
              >
                {contact.email.address}
              </a>
              <p className="mt-3 flex items-center gap-2 text-xs text-ink/50">
                {/* clock */}
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                  <circle
                    cx="8"
                    cy="8"
                    r="6.25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.1"
                  />
                  <path
                    d="M8 4.5V8l2.5 1.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                </svg>
                {contact.email.note}
              </p>
            </RevealItem>

            <RevealItem className="border-t border-ink/10 pt-6">
              <p className={label}>{contact.mailing.label}</p>
              <div className="mt-4 flex gap-2 text-sm leading-relaxed text-ink/70">
                {/* pin */}
                <svg
                  viewBox="0 0 16 16"
                  className="mt-0.5 h-4 w-4 shrink-0 text-ink/50"
                  aria-hidden
                >
                  <path
                    d="M8 1.5c2.5 0 4.5 2 4.5 4.5C12.5 9.5 8 14.5 8 14.5S3.5 9.5 3.5 6C3.5 3.5 5.5 1.5 8 1.5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.1"
                  />
                  <circle
                    cx="8"
                    cy="6"
                    r="1.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.1"
                  />
                </svg>
                <span>
                  {contact.mailing.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </div>
            </RevealItem>

            <RevealItem className="border-t border-ink/10 pt-6">
              <p className={label}>{contact.connectLabel}</p>
              <ul className="mt-4 space-y-3">
                {contact.socials.map((s) => {
                  const row = (
                    <>
                      <span className="text-sm text-ink transition-colors group-hover:text-gold">
                        {s.name}
                      </span>
                      <span className="text-xs text-ink/40">{s.handle}</span>
                    </>
                  );
                  return (
                    <li key={s.name} className="flex items-baseline justify-between gap-4">
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-1 items-baseline justify-between gap-4"
                        >
                          {row}
                        </a>
                      ) : (
                        row
                      )}
                    </li>
                  );
                })}
              </ul>
            </RevealItem>
          </Reveal>

          {/* Right — form */}
          <Reveal>
            <ContactForm form={contact.form} />
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
