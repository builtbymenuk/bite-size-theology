"use client";

import { useState } from "react";
import type { Contact } from "@/lib/content";

// Shared underline field style (design shows borderless inputs with a single bottom rule).
const field =
  "w-full border-b border-ink/15 bg-transparent py-3 text-sm text-ink placeholder:text-ink/40 focus:border-ink outline-none transition-colors";

export default function ContactForm({ form }: { form: Contact["form"] }) {
  const [sent, setSent] = useState(false);

  // ponytail: native `required` + type="email" do the validation, so submit just flips to the
  // thank-you state. Wire this to an API route / server action when real delivery is needed.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] md:p-12">
      <h2 className="font-display text-3xl md:text-4xl">{form.heading}</h2>
      <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-ink/40">
        {form.subheading}
      </p>

      {sent ? (
        <p className="mt-12 max-w-sm text-sm leading-relaxed text-ink/70">
          {form.success}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <input
              type="text"
              name="name"
              required
              placeholder={form.fields.name}
              className={field}
            />
            <input
              type="email"
              name="email"
              required
              placeholder={form.fields.email}
              className={field}
            />
          </div>

          <div className="relative">
            <select
              name="subject"
              defaultValue=""
              required
              className={`${field} appearance-none pr-8`}
            >
              <option value="" disabled hidden>
                {form.fields.subject}
              </option>
              {form.subjectOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            {/* chevron */}
            <svg
              aria-hidden
              viewBox="0 0 12 12"
              className="pointer-events-none absolute right-1 top-4 h-3 w-3 text-ink/50"
            >
              <path
                d="M2 4l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          </div>

          <textarea
            name="message"
            required
            rows={4}
            placeholder={form.fields.message}
            className={`${field} resize-none`}
          />

          <button
            type="submit"
            className="inline-flex items-center gap-3 bg-ink px-8 py-4 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal"
          >
            {form.submit}
            {/* paper plane */}
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              <path
                d="M15 1L7 9M15 1L10 15l-3-6-6-3L15 1z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}
