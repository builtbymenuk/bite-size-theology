import { describe, expect, test } from "vitest";
import { withEnv } from "../../test/env";
import { networkError, stubFetch } from "../../test/fetch-stub";
import * as fb from "./content";

const STRAPI = { STRAPI_URL: "http://strapi.test", STRAPI_API_TOKEN: "test-token" };
const load = (env: Record<string, string> = STRAPI) => withEnv(env, () => import("./cms"));

describe("absolutize", () => {
  test("prefixes relative media with STRAPI_PUBLIC_URL (else STRAPI_URL), passes http through", async () => {
    const a = (await load()).absolutize;
    expect(a("/uploads/x.png")).toBe("http://strapi.test/uploads/x.png");
    expect(a("https://cdn.test/x.png")).toBe("https://cdn.test/x.png");
    expect(a("")).toBeUndefined();
    expect(a(undefined)).toBeUndefined();

    const b = (await load({ ...STRAPI, STRAPI_PUBLIC_URL: "https://media.test" })).absolutize;
    expect(b("/uploads/x.png")).toBe("https://media.test/uploads/x.png");
  });
});

describe("single-type getters", () => {
  test("getContact maps flat CMS fields into the nested shape, with the Bearer token", async () => {
    const { getContact } = await load();
    const net = stubFetch({
      "strapi.test/api/contact": {
        json: {
          data: {
            headingLead: "Say hi",
            emailAddress: "cms@test.dev",
            mailingLines: [{ value: "PO Box 1" }],
            fieldName: "Your name",
          },
        },
      },
    });
    const c = await getContact();
    expect(net.calls[0].url).toBe("http://strapi.test/api/contact?populate=*");
    expect(net.calls[0].headers.authorization).toBe("Bearer test-token");
    expect(c.headingLead).toBe("Say hi");
    expect(c.email.address).toBe("cms@test.dev");
    expect(c.mailing.lines).toEqual(["PO Box 1"]);
    expect(c.form.fields.name).toBe("Your name");
    // Blank fields fall back field-by-field.
    expect(c.intro).toBe(fb.contact.intro);
    expect(c.socials).toEqual(fb.contact.socials);
  });

  test("getHero maps socials (blanks kept) and absolutizes the background image", async () => {
    const { getHero } = await load();
    stubFetch({
      "strapi.test/api/hero": {
        json: { data: { tagline: "T", urlInstagram: " https://ig.test/x ", bgImage: { url: "/uploads/bg.jpg" } } },
      },
    });
    const h = await getHero();
    expect(h.tagline).toBe("T");
    expect(h.bgImage).toBe("http://strapi.test/uploads/bg.jpg");
    expect(h.socials).toHaveLength(6);
    expect(h.socials[0]).toEqual({ platform: "instagram", url: "https://ig.test/x" });
    expect(h.socials[1]).toEqual({ platform: "youtube", url: "" });
    expect(h.subtext).toBe(fb.hero.subtext);
  });

  test.each([
    ["a 500", { status: 500, json: {} }],
    ["a network error", networkError],
    ["an empty data payload", { json: { data: null } }],
  ] as const)("falls back to content.ts on %s", async (_label, reply) => {
    const { getContact, getHero } = await load();
    stubFetch({ "strapi.test/api/contact": reply, "strapi.test/api/hero": reply });
    expect(await getContact()).toEqual(fb.contact);
    expect(await getHero()).toEqual(fb.hero);
  });

  test("no STRAPI_URL: static content and no fetch at all", async () => {
    const { getContact, getHero, getNotificationSettings, getProduct } = await load({});
    const net = stubFetch({ "": { json: {} } });
    expect(await getContact()).toEqual(fb.contact);
    expect(await getHero()).toEqual(fb.hero);
    expect(await getNotificationSettings()).toEqual({});
    expect(await getProduct(fb.storeProducts[0].slug)).toEqual(fb.storeProducts[0]);
    expect(net.calls).toHaveLength(0);
  });
});

describe("getNotificationSettings", () => {
  test("trims values and turns blanks into undefined", async () => {
    const { getNotificationSettings } = await load();
    const net = stubFetch({
      "strapi.test/api/notification-settings": {
        json: { data: { contactTo: "  a@test.dev ", bookingTo: "   ", prayerTo: null } },
      },
    });
    expect(await getNotificationSettings()).toEqual({
      contactTo: "a@test.dev",
      bookingTo: undefined,
      prayerTo: undefined,
    });
    expect(net.calls[0].headers.authorization).toBe("Bearer test-token");
  });

  test.each([
    ["a 500", { status: 500, json: {} }],
    ["a network error", networkError],
  ] as const)("{} on %s", async (_label, reply) => {
    const { getNotificationSettings } = await load();
    stubFetch({ "strapi.test/api/notification-settings": reply });
    expect(await getNotificationSettings()).toEqual({});
  });
});

describe("getProduct", () => {
  test("maps price strings to numbers and queries by encoded slug", async () => {
    const { getProduct } = await load();
    const net = stubFetch({
      "strapi.test/api/products": {
        json: {
          data: [
            {
              slug: "cms-tee",
              title: "CMS Tee",
              price: "29.50",
              compareAtPrice: "35",
              images: [{ url: "/uploads/t.png" }],
              sizes: [{ value: "M" }, { value: "" }],
              category: { slug: "tees" },
            },
          ],
        },
      },
    });
    const p = await getProduct("cms tee");
    expect(net.calls[0].url).toContain("filters[slug][$eq]=cms%20tee");
    expect(p).toMatchObject({
      slug: "cms-tee",
      price: 29.5,
      compareAtPrice: 35,
      images: ["http://strapi.test/uploads/t.png"],
      sizes: ["M"],
      category: "tees",
      featured: false,
      soldOut: false,
    });
  });

  test("falls back to the static catalogue when Strapi has no match, null for unknown slugs", async () => {
    const { getProduct } = await load();
    stubFetch({ "strapi.test/api/products": { json: { data: [] } } });
    const known = fb.storeProducts[0];
    expect(await getProduct(known.slug)).toEqual(known);
    expect(await getProduct("does-not-exist")).toBeNull();
  });
});
