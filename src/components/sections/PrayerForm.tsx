"use client";

import { useState } from "react";
import type { Prayer } from "@/lib/content";

// Shared underline field style (design shows borderless inputs with a single bottom rule).
const field =
  "w-full border-b border-ink/15 bg-transparent py-3 text-sm text-ink placeholder:text-ink/40 focus:border-ink outline-none transition-colors";

export default function PrayerForm({
  form,
  privacyNote,
  assurance,
}: {
  form: Prayer["form"];
  privacyNote: string;
  assurance: Prayer["assurance"];
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // request is required; name/email are optional (anonymous is fine). POST to /api/prayer, which
  // emails the prayer team and stores the request in Strapi (see that route).
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError("");
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/prayer", {
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
        <div className="mt-12">
          <p className="font-display text-2xl text-gold">{assurance.heading}</p>
          <p className="mt-4 max-w-md whitespace-pre-line text-sm leading-relaxed text-ink/70">
            {assurance.body}
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-8">
          {/* honeypot — real users never see or fill this; bots do. ponytail: no captcha yet */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />

          <textarea
            name="request"
            required
            rows={4}
            placeholder={form.fields.request}
            className={`${field} resize-none`}
          />

          <div className="grid gap-8 md:grid-cols-2">
            <input type="text" name="name" placeholder={form.fields.name} className={field} />
            <input type="email" name="email" placeholder={form.fields.email} className={field} />
          </div>

          <label className="flex items-center gap-3 text-sm text-ink/70">
            <input type="checkbox" name="urgent" className="h-4 w-4 accent-gold" />
            {form.urgentLabel}
          </label>

          <p className="text-xs leading-relaxed text-ink/40">{privacyNote}</p>

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
          </button>
        </form>
      )}
    </div>
  );
}
