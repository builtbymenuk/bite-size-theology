// One-shot generator for the Strapi content-types + components.
// 13 single types × (schema + 3 identical factory files) + 9 components is ~60
// near-identical files — a compact spec + this generator beats hand-authoring each.
// Field names MUST match the mappers in ../src/lib/cms.ts. Run once: `node scripts/gen.mjs`.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const write = (rel, data) => {
  const p = resolve(ROOT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n");
  console.log("wrote", rel);
};

// --- attribute helpers ---
const s = () => ({ type: "string" });
const t = () => ({ type: "text" });
const b = () => ({ type: "boolean", default: false });
const media = () => ({ type: "media", multiple: false, allowedTypes: ["images"] });
const enm = (...v) => ({ type: "enumeration", enum: v });
const rep = (component) => ({ type: "component", repeatable: true, component });
const dec = () => ({ type: "decimal" });
const uidField = (target) => ({ type: "uid", targetField: target });
const mediaMulti = () => ({ type: "media", multiple: true, allowedTypes: ["images"] });
const json = () => ({ type: "json" });
const req = (attr) => ({ ...attr, required: true });
const uniq = (attr) => ({ ...attr, unique: true }); // DB unique — multiple NULLs allowed (SQLite)
const int = () => ({ type: "integer", default: 0 });
const rel = (relation, target, extra = {}) => ({ type: "relation", relation, target, ...extra });

const TONE = ["dark", "warm", "light", "cool", "gold", "yellow"];

// --- components (uid shared.<name>) ---
const components = {
  "text-item": { value: s() },
  product: { name: s(), price: s(), tag: s(), tone: enm(...TONE), image: media() },
  "faq-item": { q: t(), a: t() },
  social: { name: s(), handle: s() },
  "footer-column": { title: s(), links: rep("shared.text-item") },
  stat: { value: s(), label: s(), icon: enm("mic", "globe", "award") },
  "podcast-action": { label: s(), platform: enm("spotify", "youtube") },
  episode: { image: media(), url: s(), title: s() },
  "tour-date": { city: s(), venue: s(), date: s(), soldOut: b(), url: s() },
  "tour-region": {
    regionId: s(),
    eyebrow: s(),
    heading: s(),
    code: s(),
    dates: rep("shared.tour-date"),
  },
};

const snake = (name) => name.replace(/-/g, "_");
const plural = (name) => `${name}s`; // navs, heroes… good enough; must just be unique

for (const [name, attributes] of Object.entries(components)) {
  write(`src/components/shared/${name}.json`, {
    collectionName: `components_shared_${snake(plural(name))}`,
    info: { displayName: name },
    options: {},
    attributes,
  });
}

// --- single types (uid api::<name>.<name>, REST GET /api/<name>) ---
// keys are the singularName == the path used in cms.ts.
const singles = {
  nav: { display: "Shared — Navbar", attrs: { logo: s(), cta: s(), links: rep("shared.text-item") } },
  hero: { display: "Homepage — 1. Hero", attrs: { tagline: s(), subtext: t(), cta: s(), bgImage: media() } },
  eyebrow: { display: "Homepage — 2. Eyebrow Strip", attrs: { value: s() } },
  calling: {
    display: "Homepage — 3. The Calling",
    attrs: {
      headingScript: s(), heading: s(), quote: t(), introLabel: s(),
      body: rep("shared.text-item"), signature: s(), rootedTitle: s(), rootedBody: t(),
    },
  },
  "all-thing": {
    display: "Homepage — 4. All the Things",
    attrs: { headingLead: s(), headingScript: s(), subtext: t() },
  },
  collection: {
    display: "Homepage — 5. The Collection",
    attrs: {
      eyebrow: s(), heading: s(), link: s(), products: rep("shared.product"),
      quoteText: t(), quoteBody: t(), quoteCta: s(),
    },
  },
  podcast: {
    display: "Homepage — 6. Podcast Promo",
    attrs: {
      eyebrow: s(), note: s(), quote: t(), badgeRank: s(), badgeCategory: s(),
      actions: rep("shared.podcast-action"),
      episodes: rep("shared.episode"), // video wall: image + link + title per tile (up to 15 shown)
    },
  },
  "podcast-page": {
    display: "Page — Podcast",
    attrs: {
      heroName: s(), heroHeading: s(), heroHeadingAccent: s(), heroSubtext: t(),
      stats: rep("shared.stat"),
      ctaHeadingLead: s(), ctaHeadingAccent: s(), ctaBody: t(), ctaPills: rep("shared.text-item"),
    },
  },
  faq: {
    display: "Homepage — 7. FAQ",
    attrs: {
      supportEyebrow: s(), supportHeading: s(), supportBody: t(), supportCta: s(),
      headingLead: s(), headingScript: s(), items: rep("shared.faq-item"),
    },
  },
  footer: {
    display: "Shared — Footer",
    attrs: {
      columns: rep("shared.footer-column"),
      messageLead: s(), messageWord: s(), messageBody: t(),
      wordmark: s(), copyright: s(), legal: rep("shared.text-item"),
    },
  },
  about: {
    display: "Page — About",
    attrs: {
      eyebrow: s(), headingLead: s(), headingName: s(), name: s(), role: s(), donateCta: s(),
      intro: t(), turnLead: s(), story: rep("shared.text-item"), missionLabel: s(),
      quoteText: t(), quoteAttribution: s(),
      heroImage: media(), turnImage: media(), missionImage: media(),
    },
  },
  contact: {
    display: "Page — Contact",
    attrs: {
      headingLead: s(), headingScript: s(), intro: t(),
      emailLabel: s(), emailAddress: s(), emailNote: s(),
      mailingLabel: s(), mailingLines: rep("shared.text-item"),
      connectLabel: s(), socials: rep("shared.social"),
      formHeading: s(), formSubheading: s(),
      fieldName: s(), fieldEmail: s(), fieldSubject: s(), fieldMessage: s(),
      subjectOptions: rep("shared.text-item"), formSubmit: s(), formSuccess: s(),
    },
  },
  tour: {
    display: "Page — Tour",
    attrs: { regions: rep("shared.tour-region"), heroPhoto: media(), secondPhoto: media() },
  },
  store: {
    display: "Store — Page",
    attrs: {
      heroEyebrow: s(), heroHeading: s(), heroSubtext: t(), heroCta: s(), heroImage: media(),
      proceedsBanner: s(),
      bestSellersHeading: s(), newArrivalsHeading: s(),
      founderEyebrow: s(), founderHeading: s(), founderBody: t(), founderCta: s(), founderImage: media(),
      shippingFee: dec(), currency: s(),
    },
  },
};

const factory = (kind, uid) =>
  `import { factories } from '@strapi/strapi';\n\nexport default factories.createCore${kind}('${uid}');\n`;

for (const [name, { display, attrs }] of Object.entries(singles)) {
  const uid = `api::${name}.${name}`;
  write(`src/api/${name}/content-types/${name}/schema.json`, {
    kind: "singleType",
    collectionName: snake(plural(name)),
    info: { singularName: name, pluralName: plural(name), displayName: display },
    options: { draftAndPublish: false },
    attributes: attrs,
  });
  write(`src/api/${name}/routes/${name}.ts`, factory("Router", uid));
  write(`src/api/${name}/controllers/${name}.ts`, factory("Controller", uid));
  write(`src/api/${name}/services/${name}.ts`, factory("Service", uid));
}

// --- collection types (uid api::<name>.<name>, REST /api/<pluralName>) ---
// Store products + orders. Same three factory files as single types; only schema.json's
// `kind` (collectionType) and info.pluralName differ. cms.ts reads these via list()/one().
const collections = {
  category: {
    display: "Store — Categories",
    plural: "categories", // naive plural would be "categorys"; the REST route needs "categories"
    attrs: {
      name: req(s()), slug: uidField("name"), order: int(),
    },
  },
  product: {
    display: "Store — Products",
    attrs: {
      title: req(s()), slug: uidField("title"), description: t(),
      price: req(dec()), compareAtPrice: dec(),
      images: mediaMulti(), sizes: rep("shared.text-item"),
      // Editor-managed via the Category collection (was a fixed enum).
      category: rel("manyToOne", "api::category.category"),
      badge: s(), featured: b(), soldOut: b(),
    },
  },
  order: {
    display: "Store — Orders",
    attrs: {
      orderNumber: s(), email: s(), items: json(),
      subtotal: dec(), shipping: dec(), total: dec(), currency: s(),
      status: enm("paid", "fulfilled", "refunded", "cancelled"),
      provider: enm("paypal", "stripe"),
      // unique → the DB rejects a duplicate write, closing the check-then-write idempotency race
      // (concurrent confirms / refresh in a 2nd tab). Unset ids are NULL, and SQLite allows many NULLs.
      paypalOrderId: uniq(s()), paypalCaptureId: s(),
      stripeSessionId: uniq(s()), stripePaymentIntentId: s(),
      payerName: s(), shippingAddress: json(),
    },
  },
};

for (const [name, { display, attrs, plural: pluralOverride }] of Object.entries(collections)) {
  const uid = `api::${name}.${name}`;
  const pluralName = pluralOverride || plural(name);
  write(`src/api/${name}/content-types/${name}/schema.json`, {
    kind: "collectionType",
    // Table name keeps the naive plural (stable across this rename); the REST route uses pluralName.
    collectionName: snake(plural(name)),
    info: { singularName: name, pluralName, displayName: display },
    options: { draftAndPublish: false },
    attributes: attrs,
  });
  write(`src/api/${name}/routes/${name}.ts`, factory("Router", uid));
  write(`src/api/${name}/controllers/${name}.ts`, factory("Controller", uid));
  write(`src/api/${name}/services/${name}.ts`, factory("Service", uid));
}

console.log("done");
