// Deliberately NOT using ./fixtures: that fixture pre-dismisses the popup this spec is about.
import { test, expect, type Page } from "@playwright/test";

const DELAY_MS = 7_000; // content.ts newsletter.popupDelaySeconds (the fallback the e2e server uses)

const popup = (page: Page) => page.getByRole("complementary", { name: "Newsletter signup" });

// Waiting out the card's 0.4s exit takes REAL time, not clock time: motion runs the opacity fade as a
// Web Animation stamped with the page's (faked) performance.now, which runFor has pushed ~DELAY_MS
// ahead of the browser's real animation timeline — so the fade sits idle for about that long before
// it plays. Advancing the fake clock further only widens the gap. A test-clock artifact, not an app
// bug: with real time the card leaves in 0.4s.
async function expectGone(page: Page) {
  await expect(popup(page)).toHaveCount(0, { timeout: DELAY_MS + 8_000 });
}

// The popup's timer only starts once /api/newsletter/status has answered, so wait for that before
// fast-forwarding — otherwise the clock can run out before the timer even exists.
async function gotoAndAwaitStatus(page: Page, path: string) {
  const status = page.waitForResponse((r) => r.url().includes("/api/newsletter/status"));
  await page.goto(path);
  const res = await status;
  expect(res.ok()).toBe(true);
  expect(await res.json()).toEqual({ subscribed: false });
}

test.describe("newsletter popup", () => {
  test("appears after the delay, Escape dismisses it, and it stays gone after a reload", async ({ page }) => {
    await page.clock.install();
    await gotoAndAwaitStatus(page, "/");

    // not before the delay…
    await page.clock.runFor(DELAY_MS - 1_000);
    await expect(popup(page)).toHaveCount(0);
    // …but right after it
    await page.clock.runFor(1_500);
    await expect(popup(page)).toBeVisible();
    await expect(popup(page).getByText("Get this in your inbox.")).toBeVisible();

    await page.keyboard.press("Escape");
    await expectGone(page);
    const memo = await page.evaluate(() => JSON.parse(localStorage.getItem("bst-newsletter") ?? "{}"));
    expect(memo.dismissedUntil).toBeGreaterThan(await page.evaluate(() => Date.now()));

    await page.reload();
    await expect(page.locator("h1").first()).toBeVisible();
    await page.clock.runFor(DELAY_MS + 2_000);
    await expect(popup(page)).toHaveCount(0);
  });

  test("the close button dismisses it too, and a new tab respects that", async ({ page }) => {
    await page.clock.install();
    await gotoAndAwaitStatus(page, "/about");
    await page.clock.runFor(DELAY_MS + 500);
    await expect(popup(page)).toBeVisible();
    await popup(page).getByRole("button", { name: "Close" }).click();
    await expectGone(page);

    // A fresh tab has no once-per-session flag, so only the 30-day dismissal can keep it away.
    const statusCalls: string[] = [];
    const again = await page.context().newPage();
    again.on("request", (r) => {
      if (r.url().includes("/api/newsletter/status")) statusCalls.push(r.url());
    });
    await again.clock.install();
    await again.goto("/about");
    await expect(again.locator("h1").first()).toBeVisible();
    await again.clock.runFor(DELAY_MS + 2_000);
    await expect(popup(again)).toHaveCount(0);
    expect(statusCalls).toEqual([]); // suppressed locally, before asking the server
  });

  for (const route of ["/contact", "/donate"]) {
    test(`never appears on ${route}`, async ({ page }) => {
      const statusCalls: string[] = [];
      page.on("request", (r) => {
        if (r.url().includes("/api/newsletter/status")) statusCalls.push(r.url());
      });
      await page.clock.install();
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      await page.clock.runFor(DELAY_MS + 2_000);
      await expect(popup(page)).toHaveCount(0);
      // quiet routes don't even ask the server
      expect(statusCalls).toEqual([]);
    });
  }
});
