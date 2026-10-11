"use client";

// Guest cart: client-only, persisted to localStorage. No accounts, no server session.
// Prices held here are for DISPLAY ONLY — the checkout route re-prices every line from Strapi,
// so tampering with localStorage can't change what PayPal charges.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

export interface CartItem {
  slug: string;
  title: string;
  image?: string;
  size?: string;
  price: number; // unit price (display only)
  qty: number;
}

const KEY = "bst-cart";
const lineKey = (slug: string, size?: string) =>
  size ? `${slug}::${size}` : slug;

interface CartValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (item: CartItem) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  keyOf: (item: { slug: string; size?: string }) => string;
}

const Ctx = createContext<CartValue | null>(null);

// localStorage is an external store, so the cart reads it through useSyncExternalStore: the server
// render and hydration use EMPTY (no mismatch), then React re-renders with the saved cart. Writes go
// through write(), which persists and notifies — one source of truth instead of a state copy that
// two effects had to keep in sync.
const EMPTY: CartItem[] = [];
let snapshot: CartItem[] | null = null; // cached so getSnapshot returns a stable reference
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (snapshot === null) {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null");
      snapshot = Array.isArray(parsed) ? parsed : EMPTY;
    } catch {
      snapshot = EMPTY; // corrupt or unavailable storage → start empty
    }
  }
  return snapshot;
}

function write(next: CartItem[]) {
  snapshot = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / disabled — cart still works in-memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const setItems = (fn: (cur: CartItem[]) => CartItem[]) => write(fn(read()));

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const [isOpen, setOpen] = useState(false);

  // All callbacks use functional setState → no dependency on `items`, so they stay referentially
  // stable. That keeps the context value (and effects that depend on e.g. closeCart, like the
  // drawer's focus trap) from re-running on every add/qty/remove.
  const add = useCallback<CartValue["add"]>((item) => {
    setItems((cur) => {
      const k = lineKey(item.slug, item.size);
      const i = cur.findIndex((c) => lineKey(c.slug, c.size) === k);
      if (i === -1) return [...cur, item];
      const next = [...cur];
      next[i] = { ...next[i], qty: next[i].qty + item.qty };
      return next;
    });
    setOpen(true);
  }, []);

  const setQty = useCallback<CartValue["setQty"]>(
    (key, qty) =>
      setItems((cur) =>
        cur
          .map((c) => (lineKey(c.slug, c.size) === key ? { ...c, qty } : c))
          .filter((c) => c.qty > 0),
      ),
    [],
  );

  const remove = useCallback<CartValue["remove"]>(
    (key) => setItems((cur) => cur.filter((c) => lineKey(c.slug, c.size) !== key)),
    [],
  );

  const clear = useCallback(() => setItems(() => []), []);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);
  const keyOf = useCallback<CartValue["keyOf"]>(
    (i) => lineKey(i.slug, i.size),
    [],
  );

  const count = useMemo(() => items.reduce((n, c) => n + c.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((n, c) => n + c.price * c.qty, 0),
    [items],
  );

  const value = useMemo<CartValue>(
    () => ({
      items,
      count,
      subtotal,
      isOpen,
      openCart,
      closeCart,
      add,
      setQty,
      remove,
      clear,
      keyOf,
    }),
    [items, count, subtotal, isOpen, openCart, closeCart, add, setQty, remove, clear, keyOf],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
