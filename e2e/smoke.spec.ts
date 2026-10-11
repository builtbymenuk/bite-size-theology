import { test, expect, collectErrors } from "./fixtures";

const ROUTES = [
  "/",
  "/about",
  "/blog",
  "/book-caleb",
  "/contact",
  "/donate",
  "/podcast",
  "/prayer",
  "/tour",
  "/store",
  "/store/checkout",
  "/newsletter/confirmed",
  "/newsletter/unsubscribed",
  "/donate/thank-you",
  "/store/order-confirmed",
];

// Pages whose <h1> is screen-reader-only (sr-only): present for assistive tech, invisible by design.
const SR_ONLY_H1 = new Set(["/tour"]);

for (const route of ROUTES) {
  test(`smoke ${route}`, async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(route);
    expect(res, "navigation response").not.toBeNull();
    expect(res!.status()).toBeLessThan(400);

    if (SR_ONLY_H1.has(route)) {
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveClass(/sr-only/);
    } else {
      await expect(page.locator("h1").first()).toBeVisible();
    }

    // Let late effects (hydration, lazy images, client fetches) report before judging the console.
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

test("an unknown route renders Next's not-found page with a 404", async ({ page }) => {
  const res = await page.goto("/this-route-does-not-exist");
  expect(res!.status()).toBe(404);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});

test("an unknown product slug is a 404", async ({ page }) => {
  const res = await page.goto("/store/no-such-product");
  expect(res!.status()).toBe(404);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});
