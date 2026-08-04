# How to run Bite Size Theology

This project has two parts:

- **`cms/`** — the Strapi CMS (content + store admin), runs on `http://localhost:1337`
- **root** — the Next.js website, runs on `http://localhost:3000`

**Requirements:** Node.js 20+ and npm.

---

## 1. Start the CMS (Strapi) — do this first

```bash
cd cms
npm install
cp .env.example .env      # then edit .env — replace every "tobemodified" with real random values
npm run develop           # runs on http://localhost:1337
```

Open **http://localhost:1337/admin** and log in:

- **Email:** `admin@bitesizetheology.com`
- **Password:** `BiteSize2026!`  *(change this after first login)*

## 2. Start the website (Next.js) — in a second terminal, from the project root

```bash
npm install
cp .env.example .env.local   # set STRAPI_URL=http://localhost:1337
npm run dev                  # runs on http://localhost:3000
```

Open **http://localhost:3000**.

---

## Good to know

- **Order matters** — start the CMS before the website.
- **The site runs even without the CMS.** If `STRAPI_URL` is left blank in `.env.local`, the site serves built-in fallback content, so it works immediately; the CMS just makes that content editable.
- **Two separate env files:** `cms/.env` (Strapi secrets) and root `.env.local` (site config). Templates are included as `.env.example` in each location — copy and fill them in.
- **Payments are optional to run.** PayPal/Stripe keys in `.env.local` only need to be filled to test checkout — leave them blank otherwise. Store orders only save if `STRAPI_API_TOKEN` is set (create one in Strapi → Settings → API Tokens).
- **Regenerate the Strapi secrets** in `cms/.env` before going live — the `.env.example` placeholders are not secure.

## Deploying to production

See **`docs/DEPLOYMENT.html`** — a step-by-step runbook for hosting on Hostinger.
