import { test, expect, hydrated, isMobile } from "./fixtures";

test.describe("desktop nav", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(isMobile(testInfo.project.name), "the inline nav is hidden below lg");
  });

  for (const [label, path, heading] of [
    ["About", "/about", /Caleb/],
    ["Blog", "/blog", /.+/],
    ["Shop", "/store", /.+/],
    ["Contact", "/contact", /acquainted/],
  ] as const) {
    test(`${label} link reaches ${path}`, async ({ page }) => {
      await page.goto("/");
      const nav = page.getByRole("navigation");
      await hydrated(nav);
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("h1").first()).toHaveText(heading);
    });
  }

  test("the menu button is not shown", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  });
});

test.describe("mobile menu", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), "the menu button only exists below lg");
  });

  test("opens as a dialog, locks scroll, and Escape closes it and restores focus", async ({ page }) => {
    await page.goto("/about");
    const button = page.getByRole("button", { name: "Open menu" });
    await hydrated(button);
    await expect(button).toHaveAttribute("aria-expanded", "false");

    // Opened from the keyboard — the case focus restoration exists for.
    await button.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("html")).toHaveClass(/lenis-stopped/);
    // focus moves into the panel
    await expect(menu.getByRole("button", { name: "Close menu" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();
    await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
  });

  test("opened by a tap, Escape still hands focus back to the menu button", async ({ page }) => {
    // Safari doesn't focus a <button> on tap, so useDialog falls back to the menu button it's given
    // (returnFocusTo) instead of restoring to <body>. Regression guard for that fallback.
    await page.goto("/about");
    const button = page.getByRole("button", { name: "Open menu" });
    await hydrated(button);
    await button.click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused({ timeout: 2_000 });
  });

  test("the close button closes it", async ({ page }) => {
    await page.goto("/about");
    await hydrated(page.getByRole("button", { name: "Open menu" }));
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await menu.getByRole("button", { name: "Close menu" }).click();
    await expect(menu).toBeHidden();
  });

  test("a menu link navigates and the dialog goes away", async ({ page }) => {
    await page.goto("/about");
    await hydrated(page.getByRole("button", { name: "Open menu" }));
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await menu.getByRole("link", { name: "Contact", exact: true }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator("h1").first()).toHaveText(/acquainted/);
    await expect(menu).toBeHidden();
    await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
  });
});
