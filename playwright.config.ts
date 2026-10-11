import { defineConfig, devices } from "@playwright/test";

const PORT = 3100; // not 3000: a dev server may already be running there
const FAKE_STRAPI = "http://127.0.0.1:3199";

// Every secret and endpoint the app reads, forced EMPTY for the e2e server. .env.local exists on
// developer machines with real Resend/PayPal/Stripe/Strapi values, and Next loads it on build and
// start — but @next/env never overrides a variable that is already set in process.env, and an empty
// string counts as set. So these blanks win, and a test that submits a form or reaches checkout
// can't send a real email, open a real payment, or write to the real CMS.
const BLANK = Object.fromEntries(
  [
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
  ].map((k) => [k, ""]),
);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: [
    {
      // Loopback-only stand-in that opens the shop (see e2e/support/fake-strapi.mjs). Started first
      // so the Next build below can already reach it.
      command: "node e2e/support/fake-strapi.mjs",
      url: `${FAKE_STRAPI}/_health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // A production build, not `next dev`: it's what ships, and it doesn't fight the dev server
      // for .next (Next 16 dev writes to .next/dev).
      command: `npm run build && npm run start -- -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      // The one deliberate non-blank: STRAPI_URL points at the loopback fake, never the real CMS.
      env: { ...BLANK, STRAPI_URL: FAKE_STRAPI, NEXT_TELEMETRY_DISABLED: "1" },
    },
  ],
});
