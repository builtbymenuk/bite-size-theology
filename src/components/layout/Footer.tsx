import { getFooter } from "@/lib/cms";

export default async function Footer() {
  const footer = await getFooter();
  return (
    <footer className="flex min-h-screen flex-col justify-center bg-charcoal text-cream">
      <div className="mx-auto w-full max-w-7xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-16">
            {footer.columns.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] uppercase tracking-[0.25em] text-gold">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-cream/70 transition-colors hover:text-cream"
                      >
                        {l}
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
          <h2 className="font-display text-[clamp(2.5rem,13vw,11rem)] font-light leading-none tracking-tight text-cream">
            {footer.wordmark}
          </h2>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-cream/10 pt-6 text-[11px] uppercase tracking-widest text-cream/50 md:flex-row md:justify-between">
          <span>{footer.copyright}</span>
          <div className="flex gap-6">
            {footer.legal.map((l) => (
              <a key={l} href="#" className="hover:text-cream">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
