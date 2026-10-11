// Runs before every test file. Two guarantees, so no test can reach a real service:
//  1. every secret / endpoint the app reads is blanked — even if the shell that ran `npm test` has
//     real values exported (Vitest never loads .env.local, but a developer's shell might);
//  2. the global fetch throws unless a test stubbed it (test/fetch-stub.ts), so a forgotten stub
//     fails loudly instead of quietly calling Resend/PayPal/Strapi.
import { afterEach, vi } from "vitest";

const SECRETS = [
  "STRAPI_URL",
  "STRAPI_PUBLIC_URL",
  "STRAPI_API_TOKEN",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "RESEND_SEGMENT_ID",
  "CONTACT_TO",
  "BOOKING_TO",
  "PRAYER_TO",
  "SITE_URL",
  "REVALIDATE_SECRET",
  "PAYPAL_CLIENT_ID",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_ENV",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];
for (const k of SECRETS) delete process.env[k];

const blocked = (input: unknown) => {
  throw new Error(`Unstubbed network call in a test: ${String(input)} — use stubFetch()`);
};
globalThis.fetch = blocked as typeof fetch;

afterEach(() => {
  vi.useRealTimers();
});
