import CartButton from "@/components/store/CartButton";
import CartBar from "@/components/store/CartBar";

// The cart trigger belongs to the shop, not the global nav. Mounting it here scopes it to every
// /store route for free — no pathname check anywhere — and keeps it pinned while the catalog scrolls.
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Phones: CartBar is fixed over the bottom edge, so extend the footer (the last thing on every
          store page) by its height — otherwise it permanently covers the legal row. */}
      <div aria-hidden className="h-24 bg-charcoal lg:hidden" />
      <CartButton />
      <CartBar />
    </>
  );
}
