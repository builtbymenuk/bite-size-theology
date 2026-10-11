import type { Page } from "@playwright/test";
import { test, expect, isMobile } from "./fixtures";

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
  "/store/call-on-jesus-vintage-faded-hoodie",
];

// The device's own viewport, plus the narrowest common Android and the widest common iPhone.
const EXTRA_VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 430, height: 932 },
];

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
}

test.describe("mobile layout", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), "phone layouts only");
  });

  for (const route of ROUTES) {
    test(`no horizontal overflow on ${route}`, async ({ page }) => {
      const sizes = [page.viewportSize()!, ...EXTRA_VIEWPORTS];
      await page.goto(route);
      for (const size of sizes) {
        await page.setViewportSize(size);
        // let layout settle after the resize (no animation involved, just a frame)
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
        const { scrollWidth, innerWidth } = await horizontalOverflow(page);
        expect(scrollWidth, `${route} at ${size.width}x${size.height}`).toBeLessThanOrEqual(innerWidth);
      }
    });
  }

  test("hero 'THEOLOGY' line is not clipped by its mask", async ({ page }) => {
    const sizes = [page.viewportSize()!, ...EXTRA_VIEWPORTS];
    await page.goto("/");
    const line = page.locator("h1").getByText("THEOLOGY", { exact: true });
    await expect(line).toBeVisible();
    // The line slides up into place (0.42s delay + 0.9s): wait until the motion has finished, i.e.
    // the transform is identity, before measuring.
    await expect
      .poll(() => line.evaluate((el) => getComputedStyle(el).transform))
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
      const m = await line.evaluate((el) => {
        // Range rect = the glyphs' own box, which can exceed the element box with an italic
        // overhang; the parent is the overflow-hidden mask that would cut it.
        const range = document.createRange();
        range.selectNodeContents(el);
        const text = range.getBoundingClientRect();
        const mask = el.parentElement!.getBoundingClientRect();
        return { textRight: text.right, maskRight: mask.right, vw: window.innerWidth };
      });
      expect(m.textRight, `text right vs mask right at ${size.width}px`).toBeLessThanOrEqual(m.maskRight + 0.5);
      expect(m.textRight, `text right vs viewport at ${size.width}px`).toBeLessThanOrEqual(m.vw);
    }
  });
});
