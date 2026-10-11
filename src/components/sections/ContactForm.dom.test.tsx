// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { contact } from "@/lib/content";
import { stubFetch } from "../../../test/fetch-stub";
import { deferredReply } from "../../../test/deferred";
import ContactForm from "./ContactForm";

const form = contact.form;

afterEach(cleanup);

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox", { name: form.fields.name }), "Ada Lovelace");
  await user.type(screen.getByRole("textbox", { name: form.fields.email }), "ada@example.com");
  await user.selectOptions(
    screen.getByRole("combobox", { name: form.fields.subject }),
    form.subjectOptions[1],
  );
  await user.type(screen.getByRole("textbox", { name: form.fields.message }), "Hello there");
  await user.click(screen.getByRole("button", { name: form.submit }));
  return user;
}

describe("ContactForm", () => {
  test("renders the fallback copy with an accessible name on every field", () => {
    render(<ContactForm form={form} />);
    expect(screen.getByRole("heading", { name: form.heading })).toBeTruthy();
    for (const name of [form.fields.name, form.fields.email, form.fields.message]) {
      expect(screen.getByRole("textbox", { name })).toBeTruthy();
    }
    const subject = screen.getByRole("combobox", { name: form.fields.subject });
    for (const o of form.subjectOptions) {
      expect(subject.textContent).toContain(o);
    }
    // the honeypot is out of the accessibility tree, so it can't be confused for a field
    expect(screen.queryByRole("textbox", { name: /company/i })).toBeNull();
  });

  test("posts the form as JSON, shows a disabled 'Sending…' while pending, then focuses the success text", async () => {
    const pending = deferredReply({ json: { ok: true } });
    const net = stubFetch({ "/api/contact": pending.reply });
    render(<ContactForm form={form} />);

    await fillAndSubmit();

    const btn = screen.getByRole("button", { name: /Sending…/ }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    expect(net.calls).toHaveLength(1);
    const [call] = net.calls;
    expect(call.url).toBe("/api/contact");
    expect(call.method).toBe("POST");
    expect(call.headers["content-type"]).toBe("application/json");
    expect(call.body).toEqual({
      company: "",
      name: "Ada Lovelace",
      email: "ada@example.com",
      subject: form.subjectOptions[1],
      message: "Hello there",
    });

    await act(async () => pending.release());

    const success = await screen.findByText(form.success);
    expect(document.activeElement).toBe(success);
    expect(screen.queryByRole("button", { name: form.submit })).toBeNull();
    expect(document.querySelector("form")).toBeNull();
  });

  test("on a 500 shows the server's error in an alert and re-enables the button", async () => {
    stubFetch({ "/api/contact": { status: 500, json: { ok: false, error: "Mail is down." } } });
    render(<ContactForm form={form} />);

    await fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Mail is down.");
    const btn = screen.getByRole("button", { name: form.submit }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(screen.queryByText(form.success)).toBeNull();
  });

  test("falls back to a generic error when the failure has no JSON body", async () => {
    stubFetch({ "/api/contact": { status: 502, text: "Bad gateway" } });
    render(<ContactForm form={form} />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/Something went wrong/),
    );
  });
});
