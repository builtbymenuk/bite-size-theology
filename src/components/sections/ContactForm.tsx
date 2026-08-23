"use client";

import { useState } from "react";
import type { Contact } from "@/lib/content";

// Shared underline field style (design shows borderless inputs with a single bottom rule).
const field =
  "w-full border-b border-ink/15 bg-transparent py-3 text-sm text-ink placeholder:text-ink/40 focus:border-ink outline-none transition-colors";

export default function ContactForm({ form }: { form: Contact["form"] }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // native `required` + type="email" gate the fields; on submit we POST to /api/contact,
  // which stores the message in Strapi and emails a notification (see that route).
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError("");
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Something went wrong. Please try again.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
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
          {/* honeypot — real users never see or fill this; bots do. No captcha yet. */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />
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

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-3 bg-ink px-8 py-4 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending…" : form.submit}
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
