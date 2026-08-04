// native <details>/<summary> — free accessibility + state, no JS. CSS animates the open.
export default function Accordion({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  return (
    <div className="border-t border-ink/10">
      {items.map((it) => (
        <details key={it.q} className="group border-b border-ink/10 py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
            <span className="font-display text-lg md:text-xl">{it.q}</span>
            <span className="relative h-4 w-4 shrink-0 text-ink/70">
              <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-current" />
              <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-300 group-open:scale-y-0" />
            </span>
          </summary>
          <p className="max-w-lg pt-3 text-sm leading-relaxed text-ink/60">
            {it.a}
          </p>
        </details>
      ))}
    </div>
  );
}
