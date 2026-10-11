import type { Page } from "@playwright/test";
import { test, expect, hydrated } from "./fixtures";

const SUCCESS = "Thank you — your message is on its way. We'll be in touch soon.";

// Scoped to the contact form: the footer's newsletter signup is also a <form> with an email field.
const contactForm = (page: Page) =>
  page.locator("form").filter({ has: page.getByRole("button", { name: "Submit Inquiry" }) });

async function openContact(page: Page) {
  await page.goto("/contact");
  const form = contactForm(page);
  await hydrated(form);
  return form;
}

async function fillContact(page: Page) {
  const form = contactForm(page);
  await form.getByRole("textbox", { name: "Full Name" }).fill("Ada Lovelace");
  await form.getByRole("textbox", { name: "Email Address" }).fill("ada@example.com");
  await form.getByRole("combobox", { name: "Subject" }).selectOption("General Inquiry");
  await form.getByRole("textbox", { name: "Message" }).fill("Hello from the e2e suite.");
}

test.describe("contact form", () => {
  test("an empty submit is stopped by native validation — no request fires", async ({ page }) => {
    const posts: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/contact")) posts.push(r.method());
    });
    const form = await openContact(page);
    await form.getByRole("button", { name: "Submit Inquiry" }).click();

    // the first required field is the one the browser flags
    const name = form.getByRole("textbox", { name: "Full Name" });
    expect(await name.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(false);
    await expect(form.getByRole("button", { name: "Submit Inquiry" })).toBeEnabled();
    await expect(page).toHaveURL(/\/contact$/); // no native GET submission either
    expect(posts).toEqual([]);
  });

  test("a real submission with no mail provider configured shows the error alert", async ({ page }) => {
    // Nothing is mocked: this goes to the real /api/contact on the e2e server, which has
    // RESEND_API_KEY blank (playwright.config.ts) — so the route refuses with a 500 and no email can
    // possibly be sent. Proves the failure state end to end.
    const form = await openContact(page);
    await fillContact(page);
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/api/contact") && r.request().method() === "POST"),
      form.getByRole("button", { name: "Submit Inquiry" }).click(),
    ]);
    expect(res.status()).toBe(500);
    expect(res.request().postDataJSON()).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      subject: "General Inquiry",
      message: "Hello from the e2e suite.",
    });

    await expect(form.getByRole("alert")).toHaveText(
      "We couldn't send your message right now. Please email us directly.",
    );
    await expect(form.getByRole("button", { name: "Submit Inquiry" })).toBeEnabled();
    await expect(page.getByText(SUCCESS)).toHaveCount(0);
  });

  test("a successful submission replaces the form with the focused thank-you", async ({ page }) => {
    await page.route("**/api/contact", (r) => r.fulfill({ json: { ok: true } }));
    const form = await openContact(page);
    await fillContact(page);
    await form.getByRole("button", { name: "Submit Inquiry" }).click();

    const success = page.getByText(SUCCESS);
    await expect(success).toBeVisible();
    await expect(success).toBeFocused();
    await expect(page.getByRole("button", { name: "Submit Inquiry" })).toHaveCount(0);
  });
});

test.describe("donate form", () => {
  const amountBox = (page: Page) => page.getByRole("textbox", { name: "Donation amount (USD)" });
  const hint = (page: Page) => page.getByText(/Enter an amount of at least \$1/);

  test("an amount of 0 shows the hint; with no gateway configured there's no pay button at all", async ({ page }) => {
    await page.goto("/donate");
    const amount = amountBox(page);
    await hydrated(amount);
    await expect(amount).toHaveValue("50");

    await amount.fill("0");
    await expect(hint(page)).toBeVisible();
    await expect(amount).toHaveAttribute("aria-invalid", "true");

    // The e2e server blanks STRIPE_SECRET_KEY and the PayPal keys, so DonateForm renders its
    // "isn't configured" notice instead of a card button. (The disabled-card-button behaviour is
    // covered by src/components/donate/DonateForm.dom.test.tsx with stripeEnabled forced on.)
    await expect(page.getByText(/Online giving isn.t configured yet/)).toBeVisible();
    await expect(page.getByRole("button", { name: /with card/i })).toHaveCount(0);

    // a preset recovers from the invalid amount
    await page.getByRole("button", { name: "$100" }).click();
    await expect(amount).toHaveValue("100");
    await expect(hint(page)).toHaveCount(0);
  });

  test("the amount field strips non-numeric characters", async ({ page }) => {
    await page.goto("/donate");
    const amount = amountBox(page);
    await hydrated(amount);
    await amount.fill("");
    await amount.pressSequentially("$7a5");
    await expect(amount).toHaveValue("75");
  });
});
