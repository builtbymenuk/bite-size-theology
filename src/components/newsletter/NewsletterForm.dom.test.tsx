// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { newsletter } from "@/lib/content";
import { stubFetch } from "../../../test/fetch-stub";
import { deferredReply } from "../../../test/deferred";
import NewsletterForm from "./NewsletterForm";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const emailBox = () => screen.getByRole("textbox", { name: "Email address" }) as HTMLInputElement;
const submit = () =>
  screen.getByRole("button", { name: /Subscribe|Sending…/ }) as HTMLButtonElement;
const liveRegion = () => document.querySelector('[aria-live="polite"]') as HTMLElement;

describe("NewsletterForm", () => {
  test("an invalid email is stopped by native validation — nothing is posted", async () => {
    const net = stubFetch({ "/api/newsletter": { json: { ok: true, state: "pending" } } });
    const user = userEvent.setup();
    render(<NewsletterForm variant="footer" copy={newsletter} />);

    await user.type(emailBox(), "not-an-email");
    await user.click(submit());

    expect(emailBox().validity.valid).toBe(false);
    expect(net.calls).toHaveLength(0);
    expect(screen.getByText(newsletter.heading)).toBeTruthy();
  });

  test("success: pending state while sending, then the 'check your inbox' message and the local memo", async () => {
    const pending = deferredReply({ json: { ok: true, state: "pending" } });
    const net = stubFetch({ "/api/newsletter": pending.reply });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<NewsletterForm variant="popup" copy={newsletter} onSuccess={onSuccess} />);
    expect(screen.getByText(newsletter.popupHeading)).toBeTruthy();
    expect(screen.getByText(newsletter.popupBody)).toBeTruthy();

    await user.type(emailBox(), "ada@example.com");
    await user.click(submit());

    expect(submit().textContent).toBe("Sending…");
    expect(submit().disabled).toBe(true);
    expect(submit().getAttribute("aria-busy")).toBe("true");
    expect(emailBox().disabled).toBe(true);
    expect(net.calls[0].body).toEqual({ website: "", email: "ada@example.com", source: "popup" });

    await act(async () => pending.release());

    expect(liveRegion().textContent).toBe(newsletter.successText);
    expect(newsletter.successText).toMatch(/check your inbox/i);
    expect(document.querySelector("form")).toBeNull();
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem("bst-newsletter") ?? "{}")).toMatchObject({
      subscribed: true,
    });
  });

  test("duplicate: shows the already-subscribed copy", async () => {
    stubFetch({ "/api/newsletter": { json: { ok: true, state: "duplicate" } } });
    const user = userEvent.setup();
    render(<NewsletterForm variant="footer" copy={newsletter} />);
    await user.type(emailBox(), "ada@example.com");
    await user.click(submit());

    await screen.findByText(newsletter.alreadySubscribedText);
    expect(liveRegion().textContent).toBe(newsletter.alreadySubscribedText);
    expect(document.querySelector("form")).toBeNull();
  });

  test("server error: alert with the message, field marked invalid and described by it, form kept", async () => {
    stubFetch({ "/api/newsletter": { status: 500, json: { ok: false, error: "List is unavailable." } } });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<NewsletterForm variant="footer" copy={newsletter} onSuccess={onSuccess} />);
    await user.type(emailBox(), "ada@example.com");
    await user.click(submit());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("List is unavailable.");
    expect(emailBox().getAttribute("aria-invalid")).toBe("true");
    expect(emailBox().getAttribute("aria-describedby")).toBe(alert.id);
    expect(submit().disabled).toBe(false);
    expect(liveRegion().textContent).toBe("");
    expect(onSuccess).not.toHaveBeenCalled();
    expect(localStorage.getItem("bst-newsletter")).toBeNull();
  });
});
