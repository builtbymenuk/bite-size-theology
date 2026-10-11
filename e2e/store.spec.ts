import { test, expect, hydrated } from "./fixtures";

// From content.ts storeProducts: the hoodie has sizes and costs $45; the book is sold out.
// The shop is open only because the e2e server's fake Strapi says comingSoon: false
// (e2e/support/fake-strapi.mjs) — the static fallback alone keeps it closed.
const HOODIE = /Call on Jesus.*Hooded Sweatshirt/;
const HOODIE_SLUG = "call-on-jesus-vintage-faded-hoodie";

test("add a sized product to the cart, change qty, and see it at checkout", async ({ page }) => {
  await page.goto("/store");
  await page.getByRole("link", { name: HOODIE }).first().click();
  await expect(page).toHaveURL(new RegExp(`/store/${HOODIE_SLUG}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(HOODIE);

  // no size yet → the picker asks for one and nothing is added
  await hydrated(page.getByRole("button", { name: "Add to cart" }));
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("— please select one")).toBeVisible();
  const cart = page.getByRole("dialog", { name: "Shopping cart" });
  await expect(cart).toHaveCount(0);

  await page.getByRole("button", { name: "M", exact: true }).click();
  await expect(page.getByRole("button", { name: "M", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("— please select one")).toHaveCount(0);
  await page.getByRole("button", { name: "Add to cart" }).click();

  await expect(cart).toBeVisible();
  await expect(cart.getByText(HOODIE)).toBeVisible();
  await expect(cart.getByText("Size: M")).toBeVisible();
  const subtotal = cart.getByText("Subtotal").locator("xpath=following-sibling::span");
  await expect(subtotal).toHaveText("$45.00");

  await cart.getByRole("button", { name: "Increase quantity" }).click();
  await expect(subtotal).toHaveText("$90.00");
  await expect(cart.getByRole("heading", { name: /Cart/ })).toHaveText(/\(2\)/);

  await cart.getByRole("link", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/store\/checkout$/);
  await expect(page.getByRole("heading", { level: 1, name: "Checkout" })).toBeVisible();
  // the link closes the drawer; let its slide-out finish so only the checkout's own list remains
  await expect(cart).toHaveCount(0);
  const line = page.getByRole("listitem").filter({ hasText: HOODIE });
  await expect(line).toBeVisible();
  await expect(line).toContainText("Size: M");
  await expect(line).toContainText("Qty: 2");
  await expect(line).toContainText("$90.00");
});

test("the cart survives a reload", async ({ page }) => {
  await page.goto(`/store/${HOODIE_SLUG}`);
  await hydrated(page.getByRole("button", { name: "L", exact: true }));
  await page.getByRole("button", { name: "L", exact: true }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeVisible();

  await page.goto("/store/checkout");
  await expect(page.getByRole("listitem").filter({ hasText: HOODIE })).toContainText("Size: L");
});

test("the sold-out book shows Sold Out and no add button", async ({ page }) => {
  await page.goto("/store/the-untitled-book");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Untitled Book");
  await expect(page.getByText("Sold Out", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to cart" })).toHaveCount(0);
});
