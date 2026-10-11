// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { prayer } from "@/lib/content";
import { stubFetch } from "../../../test/fetch-stub";
import { deferredReply } from "../../../test/deferred";
import PrayerForm from "./PrayerForm";

const { form, privacyNote, assurance } = prayer;

afterEach(cleanup);

const renderForm = () =>
  render(<PrayerForm form={form} privacyNote={privacyNote} assurance={assurance} />);

describe("PrayerForm", () => {
  test("renders fallback copy with accessible fields", () => {
    renderForm();
    expect(screen.getByRole("heading", { name: form.heading })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: form.fields.request })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: form.fields.name })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: form.fields.email })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: form.urgentLabel })).toBeTruthy();
    expect(screen.getByText(privacyNote)).toBeTruthy();
  });

  test("posts JSON including the urgent checkbox, shows pending state, then focuses the assurance", async () => {
    const pending = deferredReply({ json: { ok: true } });
    const net = stubFetch({ "/api/prayer": pending.reply });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole("textbox", { name: form.fields.request }), "My mum's surgery");
    await user.type(screen.getByRole("textbox", { name: form.fields.name }), "Sam");
    await user.click(screen.getByRole("checkbox", { name: form.urgentLabel }));
    await user.click(screen.getByRole("button", { name: form.submit }));

    const btn = screen.getByRole("button", { name: "Sending…" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    expect(net.calls).toHaveLength(1);
    expect(net.calls[0].url).toBe("/api/prayer");
    expect(net.calls[0].method).toBe("POST");
    expect(net.calls[0].body).toEqual({
      website: "",
      request: "My mum's surgery",
      name: "Sam",
      email: "",
      urgent: "on",
    });

    await act(async () => pending.release());

    const heading = await screen.findByText(assurance.heading);
    // the focused element is the wrapper around the assurance copy
    expect(document.activeElement).toBe(heading.parentElement);
    expect(document.querySelector("form")).toBeNull();
  });

  test("leaves urgent out of the payload when unchecked", async () => {
    const net = stubFetch({ "/api/prayer": { json: { ok: true } } });
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole("textbox", { name: form.fields.request }), "Peace");
    await user.click(screen.getByRole("button", { name: form.submit }));
    await screen.findByText(assurance.heading);
    expect(net.calls[0].body).not.toHaveProperty("urgent");
  });

  test("on a 500 shows the server error in an alert", async () => {
    stubFetch({ "/api/prayer": { status: 500, json: { error: "Could not send." } } });
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole("textbox", { name: form.fields.request }), "Peace");
    await user.click(screen.getByRole("button", { name: form.submit }));
    expect((await screen.findByRole("alert")).textContent).toBe("Could not send.");
    expect((screen.getByRole("button", { name: form.submit }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
});
