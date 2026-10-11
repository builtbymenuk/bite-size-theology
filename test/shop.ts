import { beforeEach, vi } from "vitest";

// The static fallback store in content.ts is "coming soon", and priceCart refuses carts while it
// is. Store tests open it with a partial mock of getStore; a test closes it via `shop.open = false`.
//
// Call openShop() INSIDE withEnv's loader (after vi.resetModules): vi.doMock is registered per
// load, so the factory re-imports the real cms module under the env that load stubbed. A hoisted
// vi.mock would keep the first test's module, and with it the first test's STRAPI_URL.
export const shop = { open: true };

beforeEach(() => {
  shop.open = true;
});

export function openShop() {
  vi.doMock("@/lib/cms", async () => {
    const real = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms");
    return { ...real, getStore: async () => ({ ...(await real.getStore()), comingSoon: !shop.open }) };
  });
}
