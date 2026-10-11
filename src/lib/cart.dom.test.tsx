// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { CartItem } from "./cart";

type CartModule = typeof import("./cart");
type Cart = ReturnType<CartModule["useCart"]>;

const KEY = "bst-cart";
const hoodieM: CartItem = { slug: "hoodie", title: "Hoodie", size: "M", price: 45, qty: 1 };
const hoodieL: CartItem = { ...hoodieM, size: "L" };
const sticker: CartItem = { slug: "sticker", title: "Sticker", price: 4, qty: 2 };

// cart.tsx caches its localStorage snapshot at module level, so each test gets a fresh module —
// otherwise one test's cart leaks into the next.
async function mount() {
  const mod: CartModule = await import("./cart");
  const ref: { current: Cart | null } = { current: null };
  function Probe() {
    ref.current = mod.useCart();
    return null;
  }
  render(
    <mod.CartProvider>
      <Probe />
    </mod.CartProvider>,
  );
  const cart = () => ref.current!;
  return { cart };
}

const stored = () => JSON.parse(localStorage.getItem(KEY) ?? "null");

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});
afterEach(cleanup);

describe("CartProvider / useCart", () => {
  test("starts empty and closed", async () => {
    const { cart } = await mount();
    expect(cart().items).toEqual([]);
    expect(cart().count).toBe(0);
    expect(cart().subtotal).toBe(0);
    expect(cart().isOpen).toBe(false);
  });

  test("add opens the cart and merges qty for the same slug+size, keeping other sizes separate", async () => {
    const { cart } = await mount();
    act(() => cart().add(hoodieM));
    expect(cart().isOpen).toBe(true);
    act(() => cart().add({ ...hoodieM, qty: 2 }));
    act(() => cart().add(hoodieL));
    act(() => cart().add(sticker));

    expect(cart().items).toEqual([{ ...hoodieM, qty: 3 }, hoodieL, sticker]);
    expect(cart().count).toBe(6);
    expect(cart().subtotal).toBe(45 * 4 + 4 * 2);
    expect(cart().keyOf(hoodieM)).toBe("hoodie::M");
    expect(cart().keyOf(sticker)).toBe("sticker");
  });

  test("setQty changes one line; setQty 0 removes it", async () => {
    const { cart } = await mount();
    act(() => cart().add(hoodieM));
    act(() => cart().add(hoodieL));
    act(() => cart().setQty("hoodie::M", 5));
    expect(cart().items.map((i) => i.qty)).toEqual([5, 1]);
    act(() => cart().setQty("hoodie::M", 0));
    expect(cart().items).toEqual([hoodieL]);
  });

  test("remove and clear", async () => {
    const { cart } = await mount();
    act(() => cart().add(hoodieM));
    act(() => cart().add(sticker));
    act(() => cart().remove("sticker"));
    expect(cart().items).toEqual([hoodieM]);
    act(() => cart().clear());
    expect(cart().items).toEqual([]);
    expect(stored()).toEqual([]);
  });

  test("openCart / closeCart", async () => {
    const { cart } = await mount();
    act(() => cart().openCart());
    expect(cart().isOpen).toBe(true);
    act(() => cart().closeCart());
    expect(cart().isOpen).toBe(false);
  });

  test("every change is persisted to localStorage['bst-cart']", async () => {
    const { cart } = await mount();
    act(() => cart().add(hoodieM));
    expect(stored()).toEqual([hoodieM]);
    act(() => cart().add(hoodieM));
    expect(stored()).toEqual([{ ...hoodieM, qty: 2 }]);
  });

  test("a fresh module restores the saved cart from localStorage", async () => {
    const first = await mount();
    act(() => first.cart().add(hoodieM));
    act(() => first.cart().add(sticker));
    cleanup();

    vi.resetModules();
    const second = await mount();
    expect(second.cart().items).toEqual([hoodieM, sticker]);
    expect(second.cart().count).toBe(3);
    // the drawer doesn't reopen just because there's something saved
    expect(second.cart().isOpen).toBe(false);
  });

  test.each([
    ["invalid JSON", "{not json"],
    ["a non-array value", JSON.stringify({ slug: "x" })],
  ])("corrupt storage (%s) → empty cart that still works", async (_label, raw) => {
    localStorage.setItem(KEY, raw);
    const { cart } = await mount();
    expect(cart().items).toEqual([]);
    act(() => cart().add(sticker));
    expect(stored()).toEqual([sticker]);
  });

  test("useCart outside the provider throws", async () => {
    const mod: CartModule = await import("./cart");
    function Orphan() {
      mod.useCart();
      return null;
    }
    // React logs the thrown render error; keep the test output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow("useCart must be used within CartProvider");
  });
});
