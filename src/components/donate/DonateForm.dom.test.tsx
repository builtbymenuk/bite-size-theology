// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { donate } from "@/lib/content";
import { stubFetch } from "../../../test/fetch-stub";
import DonateForm from "./DonateForm";

// The PayPal SDK injects a <script> and talks to paypal.com — render nothing instead. These tests
// run with paypalEnabled false anyway; the mock just keeps the import inert.
vi.mock("@paypal/react-paypal-js", () => ({
  PayPalScriptProvider: () => null,
  PayPalButtons: () => null,
}));
// useRouter needs the App Router context, which only exists inside Next.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(cleanup);

const renderForm = () =>
  render(
    <DonateForm
      presets={donate.presets}
      fundOptions={donate.fundOptions}
      currency="USD"
      stripeEnabled
      paypalEnabled={false}
    />,
  );

const amountInput = () =>
  screen.getByRole("textbox", { name: "Donation amount (USD)" }) as HTMLInputElement;
const cardButton = () => screen.getByRole("button", { name: /with card/ }) as HTMLButtonElement;

describe("DonateForm", () => {
  test("starts on the second preset with an enabled card button", () => {
    renderForm();
    expect(amountInput().value).toBe(donate.presets[1]);
    expect(cardButton().textContent).toBe(`Give $${donate.presets[1]} with card`);
    expect(cardButton().disabled).toBe(false);
    expect(amountInput().getAttribute("aria-invalid")).toBe("false");
  });

  test("strips everything but digits and the decimal point from the amount", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(amountInput());
    await user.type(amountInput(), "$1a2,3.5x");
    expect(amountInput().value).toBe("123.5");
  });

  test("an amount of 0 shows the hint, marks the field invalid and disables the card button", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(amountInput());
    await user.type(amountInput(), "0");

    const hint = screen.getByText(/Enter an amount of at least \$1/);
    expect(hint.id).toBe("amount-hint");
    expect(amountInput().getAttribute("aria-invalid")).toBe("true");
    expect(amountInput().getAttribute("aria-describedby")).toBe("amount-hint");
    expect(cardButton().textContent).toBe("Give with card");
    expect(cardButton().disabled).toBe(true);
  });

  test("choosing a preset sets the amount", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(amountInput());
    await user.click(screen.getByRole("button", { name: `$${donate.presets[3]}` }));
    expect(amountInput().value).toBe(donate.presets[3]);
    expect(cardButton().textContent).toBe(`Give $${donate.presets[3]} with card`);
    expect(screen.queryByText(/Enter an amount of at least \$1/)).toBeNull();
  });

  test("the fund select is labelled 'Give toward'", async () => {
    const user = userEvent.setup();
    renderForm();
    const select = screen.getByRole("combobox", { name: "Give toward" }) as HTMLSelectElement;
    expect(select.value).toBe(donate.fundOptions[0]);
    await user.selectOptions(select, donate.fundOptions[2]);
    expect(select.value).toBe(donate.fundOptions[2]);
  });

  test("the card button posts the gift to the Stripe session route and surfaces its error", async () => {
    const net = stubFetch({
      "/api/donate/stripe/session": { status: 503, json: { error: "Card giving is offline." } },
    });
    const user = userEvent.setup();
    renderForm();
    await user.selectOptions(screen.getByRole("combobox", { name: "Give toward" }), donate.fundOptions[1]);
    await user.click(cardButton());

    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Card giving is offline."));
    expect(net.calls[0].body).toEqual({
      amount: Number(donate.presets[1]),
      name: "",
      email: "",
      fund: donate.fundOptions[1],
      message: "",
      anonymous: false,
    });
    expect(cardButton().disabled).toBe(false);
  });

  test("with neither gateway enabled it says giving isn't configured", () => {
    render(
      <DonateForm presets={donate.presets} fundOptions={[]} currency="USD" stripeEnabled={false} paypalEnabled={false} />,
    );
    expect(screen.getByText(/Online giving isn.t configured yet/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /with card/ })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Give toward" })).toBeNull();
  });
});
