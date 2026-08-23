import CartButton from "@/components/store/CartButton";
import CartBar from "@/components/store/CartBar";

// The cart trigger belongs to the shop, not the global nav. Mounting it here scopes it to every
// /store route for free — no pathname check anywhere — and keeps it pinned while the catalog scrolls.
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartButton />
      <CartBar />
    </>
  );
}
