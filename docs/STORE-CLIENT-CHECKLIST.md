# Store — Client Action Checklist

Everything the **store owner** must provide, decide, or do. The code, CMS structure, and
checkout logic are already built — this is only the human/business side that we can't do for you.

Work top to bottom. Items marked **🔑 required to take payments** are blockers for going live;
the rest can happen anytime.

---

## 1. Accounts & credentials you must create 🔑

Create these accounts and give us the values (or paste them into `.env.local` yourself — see
`.env.example` for the exact variable names). Use **sandbox/test** values first, then swap to
**live** when ready.

| What | Where to get it | Fills these env vars | Needed for |
|------|-----------------|----------------------|------------|
| **Strapi admin login** | First visit to `http://localhost:1337/admin` → create-admin wizard | — (account, not an env var) | Managing products, orders, all content |
| **PayPal business account + REST app** | [developer.paypal.com](https://developer.paypal.com/dashboard/) → Apps & Credentials | `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` (`sandbox`/`live`) | PayPal checkout |
| **Stripe account + secret key** | [dashboard.stripe.com](https://dashboard.stripe.com/test/apikeys) → API keys | `STRIPE_SECRET_KEY` (`sk_test_…` / `sk_live_…`) | "Pay with card" checkout |
| **Strapi API token** | Strapi admin → Settings → API Tokens → create (Full access, or custom with **create** on *Order*) | `STRAPI_API_TOKEN` | Saving completed orders into the CMS |

Notes:
- You can enable **PayPal, Stripe, or both** — each button only appears when its keys are set.
  With none set, checkout shows a "not configured" message (nothing breaks).
- **Without `STRAPI_API_TOKEN`**, payments still succeed but the order won't be recorded in Strapi
  (a warning is logged) — set it before real sales.
- Payouts land in **your** PayPal / Stripe accounts (connect your bank in each dashboard).

---

## 2. Business decisions we need from you

| Decision | Default today | How to change |
|----------|---------------|---------------|
| **Flat shipping fee** | `$5.99` | Edit in Strapi → *Store — Page* → Shipping fee (set `0` for free shipping) |
| **Countries you ship to** | US, CA, GB, AU, NZ, IE | Tell us — it's a one-line list in `src/lib/stripe.ts` |
| **Sales tax** | None | Tell us if you need it (not built yet) |
| **Order-inquiry contact email** | placeholder in FAQ/Contact | Edit in Strapi (Contact / FAQ) |
| **Return & shipping policy wording** | generic placeholder on product pages | Tell us the real policy text |

---

## 3. Content you own — all in the Strapi admin

Nothing here needs a developer. In `http://localhost:1337/admin`:

- **Products** (*Store — Products*): name, price, compare-at price (for sale strikethrough),
  description, sizes, category, badge (e.g. "New Arrival"), **Featured** (→ Best Sellers row),
  **Sold out** (hides the buy button).
- **Categories** (*Store — Categories*): add / rename / reorder (drives the filter tabs).
- **Store page copy** (*Store — Page*): hero headline + text, proceeds banner, founder section.
- **Images**: upload real product photos (first image = main) and hero/founder images.
  Until you do, tasteful colored placeholders show automatically.

> How rows land on the homepage store: **Best Sellers** = products with **Featured** on.
> **New Arrivals** = the 4 most recently created products (automatic).

---

## 4. Ongoing order operations — you handle these

| Scenario | What you do |
|----------|-------------|
| **New order** | Appears in Strapi → *Store — Orders* as `paid`. Read items/size/address and fulfill. |
| **Mark shipped** | Set the order `status` → `fulfilled`. |
| **Refund** | Do the refund in the **PayPal** or **Stripe** dashboard, then set the Strapi order `status` → `refunded`. |
| **Cancel / dispute** | Handle in PayPal/Stripe, then set `status` → `cancelled`. |
| **Pause a product** | Toggle **Sold out** in Strapi — removes the buy button immediately. |

Money lives in PayPal/Stripe; Strapi is your order book + fulfillment tracker. (Automated
"order shipped" emails and tracking numbers are **not** built yet — ask if you want them.)

---

## 5. Go-live (hosting & production)

- **Provide hosting + a domain** (the shared Node.js/Passenger plan already chosen runs both the
  Next.js site and Strapi).
- **Set production env values**: deployed `STRAPI_URL`, **live** payment keys, `STRAPI_API_TOKEN`,
  `REVALIDATE_SECRET`.
- **Product images in production**: `next.config.ts` auto-allows your `STRAPI_URL` host. If you
  serve media from S3/Cloudinary instead, tell us so we add that host.
- **Optional — instant content updates**: point a Strapi webhook (Settings → Webhooks) at
  `<your-site>/api/revalidate?secret=<REVALIDATE_SECRET>` so edits show immediately instead of
  within ~5 minutes.

---

## Quick reference

- **All env variable names + notes:** `.env.example` (copy to `.env.local` and fill in).
- **Run locally:** `cd cms && npm run develop` (Strapi :1337), then `npm run dev` (site :3000).
- **Deferred / not built yet** (say the word to add): PayPal & Stripe webhooks, order "shipped"
  emails, tracking-number field, stock counts, automated tax.
