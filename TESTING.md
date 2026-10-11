# Testing

Four layers, all run automatically in CI on every pull request and before every production deploy.

| Layer | Tool | Where | What it covers |
|---|---|---|---|
| Unit | Vitest | `src/lib/*.test.ts`, `src/lib/*.check.ts` | Pricing and cart repricing, currency, donation limits, form validation, rate limiting, email/newsletter/PayPal helpers, CMS mapping and fallbacks |
| API routes | Vitest | `src/app/api/**/route.test.ts` | Every route handler: validation, honeypots, rate limits, Strapi writes, email failures, PayPal/Stripe success, failure, idempotency |
| Components | Vitest + Testing Library (jsdom) | `src/**/*.dom.test.tsx` | Contact, prayer, donate and newsletter forms (loading, success, error states); the cart |
| End-to-end | Playwright | `e2e/*.spec.ts` | Every page loads with no console errors; navigation and the mobile menu; no horizontal overflow on phones; forms; add to cart and checkout; the newsletter popup. Runs on desktop Chrome, a mobile Chrome (Pixel 7) and mobile Safari (iPhone 13) |
| CMS | Jest + Supertest | `cms/tests/*.test.js` | Strapi public/private permissions, required and unique fields, enums, strict params, drafts vs published, upload type checks, bootstrap idempotency |

## Running locally

Website (from the repo root):

```bash
npm test                # unit + route + component tests (seconds)
npm run test:watch      # same, re-running on save
npm run test:coverage   # with a coverage report in coverage/
npm run test:e2e        # Playwright: builds the site and runs it on :3100
npm run typecheck
npm run lint
npm run check           # lint + typecheck + tests + build, i.e. what CI runs
```

The first time, install the browsers: `npx playwright install chromium webkit`.

CMS (from `cms/`):

```bash
npm test                # compiles Strapi and runs the integration tests (~30s)
```

You can keep `npm run dev` (:3000) and Strapi (`npm run develop`, :1337) running while you test. E2E uses its own server on :3100, and the CMS tests never open a port.

## Safety: tests never touch real data or send real email

- **Unit, route and component tests:** `test/setup.ts` deletes every secret and service URL from the environment and replaces `fetch` with one that throws. A test only reaches a service it explicitly stubs with `stubFetch()` (`test/fetch-stub.ts`). Stripe is mocked at `@/lib/stripe`.
- **E2E:** `playwright.config.ts` starts the site with every secret forced to an empty string. Next.js won't override an env var that is already set, even an empty one, so `.env.local` can't leak in. With no Resend key no email can be sent, and with no Strapi token nothing can be written. The only "CMS" is a tiny fake (`e2e/support/fake-strapi.mjs`, 127.0.0.1:3199) that answers `/api/store` with `comingSoon: false` so the shop can be tested. Everything else returns 404, so the site uses its built-in fallback content.
- **CMS:** `cms/tests/helpers/env.js` points Strapi at a throwaway `cms/.tmp/test.db` with dummy keys (`cms/.env.test.example`). It refuses to run against any other database file, and the file is deleted before and after the run. Your real `cms/.tmp/data.db` and `cms/.env` are never read.

## CI (`.github/workflows/ci.yml`)

Runs on every pull request and on every push to `main`, on Node 20 (the production version):

1. **web:** `npm ci`, then lint, typecheck, tests with coverage (uploaded as an artifact), production build, and `npm audit --omit=dev --audit-level=critical`.
2. **e2e:** installs Chromium and WebKit and runs Playwright. The HTML report is uploaded when something fails.
3. **cms:** `npm ci`, `npm run build`, `npm test`, plus a dependency audit that is **report-only** until Strapi is upgraded (its own dependencies currently have critical advisories).

`deploy.yml` calls the same workflow first, and the deploy jobs `need` it, so **a failing test blocks a production deploy**. To also block merging, turn on branch protection for `main` in GitHub (Settings, Branches) and require the `web`, `e2e` and `cms` checks.

## Writing a test

- **Route handler:** copy `src/app/api/contact/route.test.ts`. Load the route through `withEnv(env, () => import("./route"))`, because modules read `process.env` when they are imported. Then stub its services with `stubFetch({ "url part": reply })` and call `POST(jsonRequest(...))`.
- **Component:** name it `*.dom.test.tsx` and start it with `// @vitest-environment jsdom`.
- **Known bugs:** write them as `test.todo("BUG: …")`, so they show up in every run until fixed.
- **E2E:** import `test` and `expect` from `e2e/fixtures.ts`. It hides the newsletter popup, fails on console errors, and provides `hydrated()` to wait for React before interacting.

## Known gaps, tracked as `test.todo`

Run `npm test` to see the list. Today it includes:
- the store accepts orders while "coming soon";
- PayPal store capture doesn't compare the captured total to the cart;
- PayPal donation details aren't validated;
- Stripe store orders in zero-decimal currencies (JPY) are saved 100× too small;
- prayer requests fail when no recipient is configured;
- contact, booking and prayer forms have no rate limit;
- the webhook secret is compared non-constant-time.

The CMS suite pins one known leak: `?status=draft` on the public posts API returns unpublished posts.
