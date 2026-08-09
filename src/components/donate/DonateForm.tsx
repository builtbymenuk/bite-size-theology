"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const field =
  "w-full border-b border-ink/15 bg-transparent py-3 text-sm text-ink placeholder:text-ink/40 focus:border-ink outline-none transition-colors";

export default function DonateForm({
  presets,
  fundOptions,
  currency,
  paypalEnabled,
  stripeEnabled,
}: {
  presets: string[];
  fundOptions: string[];
  currency: string;
  paypalEnabled: boolean;
  stripeEnabled: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState<string>(presets[1] ?? presets[0] ?? "50");
  const [fund, setFund] = useState(fundOptions[0] ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const showPayPal = paypalEnabled && !!clientId;

  const amt = Number(amount);
  const valid = Number.isFinite(amt) && amt >= 1;
  const meta = () => ({ name, email, fund, message, anonymous });
  const payload = () => ({ amount: amt, ...meta() });

  return (
    <div className="rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_-20px_rgba(14,32,56,0.18)] md:p-10">
      {/* Amount */}
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink/40">Choose an amount</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {presets.map((p) => {
          const active = Number(p) === amt;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={`rounded-xl border py-3 text-sm font-medium tabular-nums transition-colors ${
                active
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/15 text-ink hover:border-ink"
              }`}
            >
              ${p}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 border-b border-ink/15 py-2">
        <span className="text-lg text-ink/50">$</span>
        <input
          type="number"
          min={1}
          step={1}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Donation amount (USD)"
          className="w-full bg-transparent text-lg tabular-nums text-ink outline-none"
        />
        <span className="text-xs uppercase tracking-widest text-ink/40">{currency}</span>
      </div>

      {/* Fund */}
      {fundOptions.length > 0 && (
        <div className="mt-6">
          <label className="text-[11px] uppercase tracking-[0.25em] text-ink/40">Give toward</label>
          <select
            value={fund}
            onChange={(e) => setFund(e.target.value)}
            className={`${field} mt-1 appearance-none`}
          >
            {fundOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Donor details (optional) */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <input type="text" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} className={field} />
        <input type="email" placeholder="Email for receipt (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </div>
      <input type="text" placeholder="Add a note (optional)" value={message} onChange={(e) => setMessage(e.target.value)} className={`${field} mt-6`} />

      <label className="mt-5 flex items-center gap-3 text-sm text-ink/70">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 accent-gold" />
        Give anonymously
      </label>

      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-gold/15 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      {/* Pay */}
      {stripeEnabled || showPayPal ? (
        <div className="mt-8 grid gap-4">
          {stripeEnabled && (
            <button
              type="button"
              disabled={redirecting || !valid}
              onClick={async () => {
                setError(null);
                if (!valid) return setError("Please enter an amount of at least $1.");
                setRedirecting(true);
                try {
                  const res = await fetch("/api/donate/stripe/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload()),
                  });
                  const data = await res.json();
                  if (!res.ok || !data?.url) {
                    setError(data?.error ?? "Could not start giving.");
                    setRedirecting(false);
                    return;
                  }
                  window.location.href = data.url;
                } catch {
                  setError("Could not start giving. Please try again.");
                  setRedirecting(false);
                }
              }}
              className="flex w-full items-center justify-center rounded-full bg-ink px-7 py-4 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors hover:bg-charcoal disabled:opacity-60"
            >
              {redirecting ? "Redirecting…" : valid ? `Give $${amt.toFixed(0)} with card` : "Give with card"}
            </button>
          )}

          {stripeEnabled && showPayPal && (
            <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.22em] text-ink/40">
              <span className="h-px flex-1 bg-ink/10" />
              or
              <span className="h-px flex-1 bg-ink/10" />
            </div>
          )}

          {showPayPal && (
            <div className={valid ? "" : "pointer-events-none opacity-50"}>
              <PayPalScriptProvider options={{ clientId: clientId!, currency, intent: "capture" }}>
                <PayPalButtons
                  forceReRender={[amt, currency]}
                  style={{ layout: "vertical", shape: "pill", color: "blue", label: "donate" }}
                  createOrder={async () => {
                    setError(null);
                    const res = await fetch("/api/donate/paypal/create", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload()),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data?.error ?? "Could not start giving.");
                      throw new Error(data?.error ?? "create failed");
                    }
                    return data.id;
                  }}
                  onApprove={async (data) => {
                    const res = await fetch("/api/donate/paypal/capture", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ orderID: data.orderID, meta: meta() }),
                    });
                    const result = await res.json();
                    if (!res.ok || !result.ok) {
                      setError(result?.error ?? "Payment could not be completed.");
                      return;
                    }
                    try {
                      sessionStorage.setItem("bst-last-donation", JSON.stringify(result));
                    } catch {
                      /* non-fatal */
                    }
                    router.push("/donate/thank-you");
                  }}
                  onError={() => setError("Something went wrong with PayPal. Please try again.")}
                />
              </PayPalScriptProvider>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-8 rounded-lg border border-ink/15 px-4 py-3 text-sm text-ink/60">
          Online giving isn’t configured yet. Set <code className="text-ink">STRIPE_SECRET_KEY</code>{" "}
          and/or <code className="text-ink">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> to enable it.
        </p>
      )}
    </div>
  );
}
