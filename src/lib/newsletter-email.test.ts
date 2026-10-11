import { describe, expect, test } from "vitest";
import { withEnv } from "../../test/env";
import { stubFetch } from "../../test/fetch-stub";
import { getRequest } from "../../test/request";

const RESEND = { RESEND_API_KEY: "re_test", RESEND_FROM: "Bite Size <hello@test.dev>" };
const load = (env: Record<string, string> = {}) =>
  withEnv(env, () => import("./newsletter-email"));

describe("siteUrl", () => {
  test("falls back to the request's own origin when SITE_URL is unset", async () => {
    const { siteUrl } = await load();
    expect(siteUrl(getRequest("/api/newsletter?x=1"))).toBe("http://localhost:3000");
  });

  test("SITE_URL wins over the request origin, trailing slashes stripped", async () => {
    const { siteUrl } = await load({ SITE_URL: "https://site.test//" });
    expect(siteUrl(getRequest("/api/newsletter"))).toBe("https://site.test");
  });
});

describe("confirmUrl / unsubscribeUrl", () => {
  test("build absolute links with the token URL-encoded", async () => {
    const { confirmUrl, unsubscribeUrl } = await load();
    expect(confirmUrl("https://site.test", "a+b/c=")).toBe(
      "https://site.test/api/newsletter/confirm?token=a%2Bb%2Fc%3D",
    );
    expect(unsubscribeUrl("https://site.test", "a b&c")).toBe(
      "https://site.test/api/newsletter/unsubscribe?token=a%20b%26c",
    );
  });
});

describe("sendConfirmation / sendWelcome", () => {
  test("confirmation email goes to the subscriber and carries the confirm link", async () => {
    const { sendConfirmation } = await load(RESEND);
    const net = stubFetch({ "api.resend.com/emails": { json: { id: "e1" } } });
    expect(await sendConfirmation("https://site.test", "jane@example.com", "tok")).toBe(true);
    const body = net.calls[0].body as Record<string, string>;
    expect(body.to).toBe("jane@example.com");
    expect(body.subject).toBe("Confirm your Bite Size Theology subscription");
    expect(body.text).toContain("https://site.test/api/newsletter/confirm?token=tok");
    expect(body.text).not.toContain("unsubscribe");
  });

  test("welcome email carries the unsubscribe link", async () => {
    const { sendWelcome } = await load(RESEND);
    const net = stubFetch({ "api.resend.com/emails": { json: { id: "e2" } } });
    expect(await sendWelcome("https://site.test", "jane@example.com", "tok")).toBe(true);
    const body = net.calls[0].body as Record<string, string>;
    expect(body.to).toBe("jane@example.com");
    expect(body.subject).toMatch(/on the list/);
    expect(body.text).toContain("https://site.test/api/newsletter/unsubscribe?token=tok");
  });

  test("both report false when Resend is not configured (no request made)", async () => {
    const { sendConfirmation, sendWelcome } = await load();
    const net = stubFetch({ "api.resend.com": { json: {} } });
    expect(await sendConfirmation("https://site.test", "j@example.com", "t")).toBe(false);
    expect(await sendWelcome("https://site.test", "j@example.com", "t")).toBe(false);
    expect(net.calls).toHaveLength(0);
  });
});
