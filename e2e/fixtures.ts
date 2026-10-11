import { test as base, expect, type Locator, type Page } from "@playwright/test";

// Shared fixture for every spec except newsletter.spec.ts: the newsletter popup is a timed corner
// card, and on phones it's a bottom sheet that can cover the very button a test wants to tap. Marking
// it dismissed (the same memo the close button writes) keeps it out of the way. newsletter.spec.ts
// imports @playwright/test directly so it sees the real behaviour.
export const test = base.extend({
  // `provide`, not the conventional `use`: eslint's rules-of-hooks mistakes `use(...)` for React's.
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          "bst-newsletter",
          JSON.stringify({ dismissedUntil: Date.now() + 864e5 }),
        );
      } catch {
        /* opaque origins (about:blank) have no storage */
      }
    });
    await provide(page);
  },
});

export { expect };

export const isMobile = (projectName: string) => projectName.startsWith("mobile-");

/**
 * Waits until React has hydrated the element. Server HTML is interactive-looking before that, and
 * a fill/click that lands first is silently lost (seen on WebKit: the amount field showed "0" but
 * React state still said 50). React tags every hydrated host node with a `__reactProps$…` key.
 */
export async function hydrated(locator: Locator) {
  await expect
    .poll(() => locator.evaluate((el) => Object.keys(el).some((k) => k.startsWith("__reactProps"))))
    .toBe(true);
}

/** Collects console errors and uncaught page errors for the life of the page. */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}
