import { getFooter, getNewsletter } from "@/lib/cms";
import { linkProps } from "@/lib/links";
import NewsletterForm from "@/components/newsletter/NewsletterForm";

export default async function Footer() {
  const [footer, newsletter] = await Promise.all([getFooter(), getNewsletter()]);
  return (
    <footer className="flex flex-col justify-center bg-charcoal md:min-h-screen text-cream">
      <div className="mx-auto w-full max-w-7xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          {/* First cell: the signup leads the row, and its gold label uses the same treatment as
              the link-column titles beside it so the three read as one system. */}
          <div className="max-w-sm">
            <NewsletterForm variant="footer" copy={newsletter} />
          </div>

          <div className="flex flex-wrap gap-x-16 gap-y-10">
            {footer.columns.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] uppercase tracking-[0.25em] text-gold">
                  {col.title}
                </p>
                {/* Phones: rows are padded to a ~40px tap target; desktop keeps the tight list. */}
                <ul className="mt-2 md:mt-4 md:space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        {...(linkProps(l.url).href ? linkProps(l.url) : { href: "#" })}
                        className="inline-block py-2.5 text-sm text-cream/70 transition-colors hover:text-cream md:py-0"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:text-right">
            <p className="font-display text-3xl">
              {footer.messageLead}{" "}
              <span className="italic text-gold">{footer.messageWord}</span>
            </p>
            <p className="mt-4 max-w-xs text-sm text-cream/60 lg:ml-auto">
              {footer.messageBody}
            </p>
          </div>
        </div>

        <div className="mt-16 overflow-hidden">
          {/* Matches the hero wordmark — same Aileron Black Italic, so the brand reads the same at
              the top and bottom of the page. The px/-mx pair gives the italic's overhang room
              inside the parent's overflow-hidden without shifting the text off the left margin. */}
          <h2 className="font-lockup px-[0.1em] -mx-[0.1em] text-[clamp(2.5rem,13vw,11rem)] font-black italic uppercase leading-none tracking-[-0.015em] text-cream">
            {footer.wordmark}
          </h2>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-cream/10 pt-6 text-[11px] uppercase tracking-widest text-cream/50 md:flex-row md:justify-between">
          <span>{footer.copyright}</span>
          <div className="-my-2 flex gap-6 md:my-0">
            {footer.legal.map((l) => (
              <a
                key={l.label}
                {...(linkProps(l.url).href ? linkProps(l.url) : { href: "#" })}
                className="py-2 hover:text-cream md:py-0"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
