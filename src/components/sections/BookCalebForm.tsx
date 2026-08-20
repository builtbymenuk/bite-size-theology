"use client";

import { useId, useState } from "react";
import type { BookCaleb } from "@/lib/content";

// The speaking-request form, split into two audiences. Both tabs POST to /api/book with an
// `audience` discriminator; the route validates the right required set per audience (see
// src/lib/booking.ts) and folds the tab-specific answers into one details block.
//
// Only ONE tab's fields are mounted at a time, which is deliberate: the two tabs reuse field
// names (organization, eventType, focus, budget…) with different labels, so rendering both and
// hiding one would post the hidden tab's empty values over the visible tab's answers.

type Tab = "church" | "corporate";

// Shared underline field style (design shows borderless inputs with a single bottom rule).
const field =
  "w-full border-b border-ink/15 bg-transparent py-3 text-sm text-ink placeholder:text-ink/40 focus:border-ink outline-none transition-colors";
const labelCls = "mb-0.5 block text-[10px] uppercase tracking-[0.18em] text-ink/45";

function Field({
  label, name, children, required, className,
}: {
  label: string;
  name: string;
  children?: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className={labelCls}>
        {label} {required ? <span className="text-gold">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function Text({
  label, name, placeholder, required, type = "text", className,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <Field label={label} name={name} required={required} className={className}>
      <input
        id={`f-${name}`}
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className={field}
      />
    </Field>
  );
}

function Select({
  label, name, options, placeholder, required, className,
}: {
  label: string;
  name: string;
  options: string[];
  placeholder: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <Field label={label} name={name} required={required} className={className}>
      <div className="relative">
        <select
          id={`f-${name}`}
          name={name}
          required={required}
          defaultValue=""
          className={`${field} appearance-none pr-8`}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((o) => (
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
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>
    </Field>
  );
}

function Area({
  label, name, placeholder, required, rows = 4,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <Field label={label} name={name} required={required}>
      <textarea
        id={`f-${name}`}
        name={name}
        required={required}
        rows={rows}
        placeholder={placeholder}
        className={`${field} resize-none`}
      />
    </Field>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-t border-ink/10 pt-6 text-[11px] uppercase tracking-[0.3em] text-ink/50">
      {children}
    </p>
  );
}

const grid = "grid gap-x-8 gap-y-6 md:grid-cols-2";

// Travel is a fixed four-way answer, not a list the client will want to tune — kept in code while
// every other dropdown comes from Strapi.
const TRAVEL = ["Yes, fully covered", "Partially covered", "Let's discuss", "Not sure yet"];

export default function BookCalebForm({ form }: { form: BookCaleb["form"] }) {
  const [tab, setTab] = useState<Tab>("church");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const panelId = useId();
  const church = tab === "church";

  // Native `required` + type="email" gate the fields; on submit we POST to /api/book, which
  // validates again, stores the request in Strapi, and emails the pastor (see that route).
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError("");
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, audience: tab }),
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

  const tabCls = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] transition-colors sm:text-[11px] ${
      active ? "bg-ink text-cream" : "text-ink/50 hover:text-ink"
    }`;

  return (
    <div className="rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] md:p-12">
      <h2 className="font-display text-3xl md:text-4xl">{form.heading}</h2>
      <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-ink/40">
        {form.subheading}
      </p>

      {sent ? (
        <p className="mt-12 max-w-sm text-sm leading-relaxed text-ink/70">{form.success}</p>
      ) : (
        <>
          {/* Same pill vocabulary as ListenWatch — one rail, the active half filled. */}
          <div
            role="tablist"
            aria-label="Event type"
            className="mt-8 flex gap-1 rounded-full border border-ink/15 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={church}
              aria-controls={panelId}
              onClick={() => setTab("church")}
              className={tabCls(church)}
            >
              {form.tabChurch}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!church}
              aria-controls={panelId}
              onClick={() => setTab("corporate")}
              className={tabCls(!church)}
            >
              {form.tabCorporate}
            </button>
          </div>

          {/* key={tab} remounts on switch so a half-filled church form doesn't leak values into
              the corporate one through shared field names. */}
          <form key={tab} id={panelId} role="tabpanel" onSubmit={onSubmit} className="mt-10 space-y-6">
            {/* honeypot — real users never see or fill this; bots do. The visible website field is
                named orgWebsite precisely so it can't be confused with this one. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            <Legend>Your information</Legend>
            <div className={grid}>
              <Text label="First name" name="firstName" required placeholder="John" />
              <Text label="Last name" name="lastName" required placeholder="Smith" />
              <Text
                label="Email address"
                name="email"
                type="email"
                required
                placeholder={church ? "john@yourchurch.com" : "john@yourcompany.com"}
              />
              <Text label="Phone number" name="phone" type="tel" required placeholder="(555) 000-0000" />
            </div>
            <Text
              label="Your role / title"
              name="role"
              required
              placeholder={
                church
                  ? "Lead Pastor, Executive Pastor, Event Director…"
                  : "CEO, VP of People, Head of L&D, Event Director…"
              }
            />

            <Legend>{church ? "Your church / organization" : "Your organization"}</Legend>
            {church ? (
              <div className={grid}>
                <Text label="Church / ministry name" name="organization" required placeholder="Grace Community Church" />
                <Text label="City & state" name="location" required placeholder="Atlanta, GA" />
                <Select label="Average weekend attendance" name="attendance" options={form.attendanceOptions} placeholder="Select range" />
                <Text label="Website" name="orgWebsite" type="url" placeholder="https://yourchurch.com" />
              </div>
            ) : (
              <div className={grid}>
                <Text label="Organization name" name="organization" required placeholder="Company or team name" />
                <Select label="Industry / type" name="industry" required options={form.industryOptions} placeholder="Select type" />
                <Text label="City & state" name="location" required placeholder="Dallas, TX" />
                <Select label="Organization size" name="orgSize" options={form.attendanceOptions} placeholder="Select range" />
                <Text label="Website" name="orgWebsite" type="url" placeholder="https://yourorganization.com" className="md:col-span-2" />
              </div>
            )}

            <Legend>Event details</Legend>
            <div className={grid}>
              <Text label="Event date" name="eventDate" type="date" required />
              <Text label="Alternate date" name="altDate" type="date" />
              <Select
                label="Event type"
                name="eventType"
                required={!church}
                options={church ? form.eventTypeOptions : form.corporateEventTypes}
                placeholder="Select event type"
              />
              <Select
                label={church ? "Expected attendance" : "Expected audience size"}
                name="audienceSize"
                options={form.attendanceOptions}
                placeholder="Select range"
              />
            </div>
            <Text
              label={church ? "Event theme / message focus" : "Topic / focus area"}
              name="focus"
              placeholder={
                church
                  ? "e.g. Discipleship, The Story of God, Faith & Work…"
                  : "e.g. Leadership culture, Purpose-driven work, Team formation…"
              }
            />
            <Area
              label={church ? "Tell us about your event" : "Tell us about your event & goals"}
              name="message"
              required
              placeholder={
                church
                  ? "Describe your event, what you're hoping Caleb will bring, any specific topics or goals, and anything else we should know…"
                  : "What's the challenge you're trying to solve? What do you want your team to walk away with? What's the context for this event?"
              }
            />

            <Legend>{church ? "Logistics" : "Logistics & budget"}</Legend>
            <div className={grid}>
              {church ? (
                <Text label="Honorarium amount" name="budget" placeholder="e.g. $2,500 or let's discuss" />
              ) : (
                <Select label="Speaking fee budget" name="budget" options={form.budgetOptions} placeholder="Prefer not to say" />
              )}
              <Select label="Will travel be covered?" name="travelCovered" options={TRAVEL} placeholder="Select" />
              <Select label="How did you hear about Caleb?" name="heardAbout" options={form.heardAboutOptions} placeholder="Select" />
              {church ? null : (
                <Select label="Decision timeline" name="timeline" options={form.timelineOptions} placeholder="Select" />
              )}
            </div>
            <Area
              label="Anything else we should know?"
              name="extra"
              rows={3}
              placeholder={
                church
                  ? "Any special considerations, other speakers involved, past events, etc."
                  : "Previous speakers you've worked with, specific outcomes you're measuring, other context…"
              }
            />

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="pt-2">
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
              <p className="mt-3 text-[11px] text-ink/40">{form.note}</p>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
