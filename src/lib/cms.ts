// The Strapi seam. Each getX() fetches its Strapi Single Type and normalizes the
// v5 response into the exact shape from content.ts. On ANY failure — STRAPI_URL
// unset, Strapi down, non-200, bad JSON, empty fields — it falls back to the
// static const in content.ts. The site is unbreakable by construction.
//
// Field naming here MUST match the Strapi schemas in cms/src/api/**. Nested
// objects (calling.rooted, collection.quote, contact.email/form, ...) are flat
// prefixed scalars in Strapi and get reassembled below.

import * as fb from "./content";
import type {
  Nav, Hero, Calling, AllThings, Collection, Podcast, PodcastPage,
  Faq, Footer, About, Contact, Tour, StoreProduct, Store, Category,
} from "./content";

const BASE = process.env.STRAPI_URL;
const TOKEN = process.env.STRAPI_API_TOKEN;

// Dev: fetch fresh every request so Strapi edits show on the next reload. Prod: 5-min ISR
// window (a Strapi webhook → /api/revalidate can invalidate sooner — see that route).
const REVALIDATE = process.env.NODE_ENV === "development" ? 0 : 300;

// Strapi media URLs are relative on local (/uploads/..); next/image needs absolute.
// Provider URLs (S3/Cloudinary) already start with http and pass through.
const absolutize = (u?: string): string | undefined =>
  u ? (u.startsWith("http") ? u : `${BASE}${u}`) : undefined;

// Use a mapped CMS array only when it actually has rows, else keep the fallback.
function arr<T>(x: unknown, map: (v: any) => T, fallback: T[]): T[] {
  return Array.isArray(x) && x.length ? x.map(map) : fallback;
}

async function single(path: string, query = "populate=*"): Promise<any | null> {
  if (!BASE) return null; // not configured → static fallback
  try {
    const res = await fetch(`${BASE}/api/${path}?${query}`, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      // Previous caching model (no cacheComponents): time-based revalidate + a tag
      // for an optional future webhook (revalidateTag needs a 2nd arg in Next 16).
      next: { tags: [path], revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    return (await res.json())?.data ?? null; // v5: flattened, no `attributes`
  } catch {
    return null; // down / network / bad JSON → static fallback
  }
}

// Collection-type sibling of single(): returns the `.data` ARRAY (v5 flattened rows), [] on any
// failure. `one()` filters that down to the first row (e.g. a product by slug).
async function list(path: string, query = "populate=*"): Promise<any[]> {
  if (!BASE) return [];
  try {
    const res = await fetch(`${BASE}/api/${path}?${query}`, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      next: { tags: [path], revalidate: REVALIDATE },
    });
    if (!res.ok) return [];
    return (await res.json())?.data ?? [];
  } catch {
    return [];
  }
}

async function one(path: string, query: string): Promise<any | null> {
  return (await list(path, query))[0] ?? null;
}

export async function getNav(): Promise<Nav> {
  const d = await single("nav");
  if (!d) return fb.nav;
  return {
    logo: d.logo || fb.nav.logo,
    cta: d.cta || fb.nav.cta,
    links: arr(d.links, (l) => l.value, fb.nav.links),
  };
}

export async function getHero(): Promise<Hero> {
  const d = await single("hero");
  if (!d) return fb.hero;
  return {
    ...fb.hero, // keeps titleLines (design token)
    tagline: d.tagline || fb.hero.tagline,
    subtext: d.subtext || fb.hero.subtext,
    cta: d.cta || fb.hero.cta,
    bgImage: absolutize(d.bgImage?.url),
  };
}

export async function getEyebrow(): Promise<string> {
  const d = await single("eyebrow", "");
  return d?.value || fb.eyebrow;
}

export async function getCalling(): Promise<Calling> {
  const d = await single("calling");
  if (!d) return fb.calling;
  return {
    headingScript: d.headingScript || fb.calling.headingScript,
    heading: d.heading || fb.calling.heading,
    quote: d.quote || fb.calling.quote,
    introLabel: d.introLabel || fb.calling.introLabel,
    body: arr(d.body, (p) => p.value, fb.calling.body),
    signature: d.signature || fb.calling.signature,
    rooted: {
      title: d.rootedTitle || fb.calling.rooted.title,
      body: d.rootedBody || fb.calling.rooted.body,
    },
  };
}

export async function getAllThings(): Promise<AllThings> {
  const d = await single("all-thing", ""); // scalars only; cards stay in code
  if (!d) return fb.allThings;
  return {
    ...fb.allThings, // keeps the 8 fixed `cards` layout slots
    headingLead: d.headingLead || fb.allThings.headingLead,
    headingScript: d.headingScript || fb.allThings.headingScript,
    subtext: d.subtext || fb.allThings.subtext,
  };
}

export async function getCollection(): Promise<Collection> {
  const d = await single("collection", "populate[products][populate]=image");
  if (!d) return fb.collection;
  return {
    eyebrow: d.eyebrow || fb.collection.eyebrow,
    heading: d.heading || fb.collection.heading,
    link: d.link || fb.collection.link,
    products: arr(
      d.products,
      (p) => ({
        name: p.name,
        price: p.price,
        tag: p.tag || undefined,
        tone: p.tone,
        image: absolutize(p.image?.url),
      }),
      fb.collection.products,
    ),
    quote: {
      text: d.quoteText || fb.collection.quote.text,
      body: d.quoteBody || fb.collection.quote.body,
      cta: d.quoteCta || fb.collection.quote.cta,
    },
  };
}

export async function getPodcast(): Promise<Podcast> {
  const d = await single("podcast");
  if (!d) return fb.podcast;
  return {
    ...fb.podcast, // keeps titleLines + gallery (design tokens)
    eyebrow: d.eyebrow || fb.podcast.eyebrow,
    note: d.note || fb.podcast.note,
    quote: d.quote || fb.podcast.quote,
    badge: {
      rank: d.badgeRank || fb.podcast.badge.rank,
      category: d.badgeCategory || fb.podcast.badge.category,
    },
    actions: arr(
      d.actions,
      (a) => ({ label: a.label, platform: a.platform }),
      fb.podcast.actions,
    ),
  };
}

export async function getPodcastPage(): Promise<PodcastPage> {
  const d = await single("podcast-page");
  if (!d) return fb.podcastPage;
  return {
    hero: {
      name: d.heroName || fb.podcastPage.hero.name,
      heading: d.heroHeading || fb.podcastPage.hero.heading,
      headingAccent: d.heroHeadingAccent || fb.podcastPage.hero.headingAccent,
      subtext: d.heroSubtext || fb.podcastPage.hero.subtext,
    },
    stats: arr(
      d.stats,
      (s) => ({ value: s.value, label: s.label, icon: s.icon }),
      fb.podcastPage.stats,
    ),
    cta: {
      pills: arr(d.ctaPills, (p) => p.value, fb.podcastPage.cta.pills),
      headingLead: d.ctaHeadingLead || fb.podcastPage.cta.headingLead,
      headingAccent: d.ctaHeadingAccent || fb.podcastPage.cta.headingAccent,
      body: d.ctaBody || fb.podcastPage.cta.body,
    },
  };
}

export async function getFaq(): Promise<Faq> {
  const d = await single("faq");
  if (!d) return fb.faq;
  return {
    supportEyebrow: d.supportEyebrow || fb.faq.supportEyebrow,
    supportHeading: d.supportHeading || fb.faq.supportHeading,
    supportBody: d.supportBody || fb.faq.supportBody,
    supportCta: d.supportCta || fb.faq.supportCta,
    headingLead: d.headingLead || fb.faq.headingLead,
    headingScript: d.headingScript || fb.faq.headingScript,
    items: arr(d.items, (i) => ({ q: i.q, a: i.a }), fb.faq.items),
  };
}

export async function getFooter(): Promise<Footer> {
  const d = await single(
    "footer",
    "populate[columns][populate]=links&populate[legal]=true",
  );
  if (!d) return fb.footer;
  return {
    columns: arr(
      d.columns,
      (c) => ({ title: c.title, links: arr(c.links, (l: any) => l.value, []) }),
      fb.footer.columns,
    ),
    messageLead: d.messageLead || fb.footer.messageLead,
    messageWord: d.messageWord || fb.footer.messageWord,
    messageBody: d.messageBody || fb.footer.messageBody,
    wordmark: d.wordmark || fb.footer.wordmark,
    copyright: d.copyright || fb.footer.copyright,
    legal: arr(d.legal, (l) => l.value, fb.footer.legal),
  };
}

export async function getAbout(): Promise<About> {
  const d = await single("about"); // populate=* covers story + 3 media
  if (!d) return fb.about;
  return {
    eyebrow: d.eyebrow || fb.about.eyebrow,
    headingLead: d.headingLead || fb.about.headingLead,
    headingName: d.headingName || fb.about.headingName,
    name: d.name || fb.about.name,
    role: d.role || fb.about.role,
    donateCta: d.donateCta || fb.about.donateCta,
    intro: d.intro || fb.about.intro,
    turnLead: d.turnLead || fb.about.turnLead,
    story: arr(d.story, (p) => p.value, fb.about.story),
    missionLabel: d.missionLabel || fb.about.missionLabel,
    quote: {
      text: d.quoteText || fb.about.quote.text,
      attribution: d.quoteAttribution || fb.about.quote.attribution,
    },
    images: {
      hero: { ...fb.about.images.hero, src: absolutize(d.heroImage?.url) },
      turn: { ...fb.about.images.turn, src: absolutize(d.turnImage?.url) },
      mission: { ...fb.about.images.mission, src: absolutize(d.missionImage?.url) },
    },
  };
}

export async function getContact(): Promise<Contact> {
  const d = await single("contact");
  if (!d) return fb.contact;
  return {
    headingLead: d.headingLead || fb.contact.headingLead,
    headingScript: d.headingScript || fb.contact.headingScript,
    intro: d.intro || fb.contact.intro,
    email: {
      label: d.emailLabel || fb.contact.email.label,
      address: d.emailAddress || fb.contact.email.address,
      note: d.emailNote || fb.contact.email.note,
    },
    mailing: {
      label: d.mailingLabel || fb.contact.mailing.label,
      lines: arr(d.mailingLines, (l) => l.value, fb.contact.mailing.lines),
    },
    connectLabel: d.connectLabel || fb.contact.connectLabel,
    socials: arr(
      d.socials,
      (s) => ({ name: s.name, handle: s.handle }),
      fb.contact.socials,
    ),
    form: {
      heading: d.formHeading || fb.contact.form.heading,
      subheading: d.formSubheading || fb.contact.form.subheading,
      fields: {
        name: d.fieldName || fb.contact.form.fields.name,
        email: d.fieldEmail || fb.contact.form.fields.email,
        subject: d.fieldSubject || fb.contact.form.fields.subject,
        message: d.fieldMessage || fb.contact.form.fields.message,
      },
      subjectOptions: arr(
        d.subjectOptions,
        (o) => o.value,
        fb.contact.form.subjectOptions,
      ),
      submit: d.formSubmit || fb.contact.form.submit,
      success: d.formSuccess || fb.contact.form.success,
    },
  };
}

export async function getTour(): Promise<Tour> {
  const d = await single(
    "tour",
    "populate[regions][populate]=dates&populate[heroPhoto]=true&populate[secondPhoto]=true",
  );
  if (!d) return fb.tour;
  return {
    ...fb.tour, // keeps heroImage/secondImage placeholder labels
    heroImageSrc: absolutize(d.heroPhoto?.url),
    secondImageSrc: absolutize(d.secondPhoto?.url),
    regions: arr(
      d.regions,
      (r) => ({
        id: r.regionId,
        eyebrow: r.eyebrow,
        ...(r.heading ? { heading: r.heading } : {}),
        ...(r.code ? { code: r.code } : {}),
        dates: arr(
          r.dates,
          (dt: any) => ({
            city: dt.city,
            venue: dt.venue,
            date: dt.date,
            status: dt.soldOut ? ("sold-out" as const) : ("get-tickets" as const),
            url: dt.url,
          }),
          [],
        ),
      }),
      fb.tour.regions,
    ),
  };
}

// --- Store ---------------------------------------------------------------

function mapProduct(p: any): StoreProduct {
  return {
    slug: p.slug,
    title: p.title,
    description: p.description || "",
    price: Number(p.price) || 0,
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : undefined,
    images: Array.isArray(p.images)
      ? (p.images.map((m: any) => absolutize(m?.url)).filter(Boolean) as string[])
      : [],
    sizes: Array.isArray(p.sizes)
      ? p.sizes.map((x: any) => x?.value).filter(Boolean)
      : [],
    category: p.category?.slug || undefined, // relation → its slug
    badge: p.badge || undefined,
    featured: !!p.featured,
    soldOut: !!p.soldOut,
  };
}

export async function getStore(): Promise<Store> {
  const d = await single("store");
  if (!d) return fb.store;
  return {
    heroEyebrow: d.heroEyebrow || fb.store.heroEyebrow,
    heroHeading: d.heroHeading || fb.store.heroHeading,
    heroSubtext: d.heroSubtext || fb.store.heroSubtext,
    heroCta: d.heroCta || fb.store.heroCta,
    heroImage: absolutize(d.heroImage?.url),
    proceedsBanner: d.proceedsBanner || fb.store.proceedsBanner,
    bestSellersHeading: d.bestSellersHeading || fb.store.bestSellersHeading,
    newArrivalsHeading: d.newArrivalsHeading || fb.store.newArrivalsHeading,
    founderEyebrow: d.founderEyebrow || fb.store.founderEyebrow,
    founderHeading: d.founderHeading || fb.store.founderHeading,
    founderBody: d.founderBody || fb.store.founderBody,
    founderCta: d.founderCta || fb.store.founderCta,
    founderImage: absolutize(d.founderImage?.url),
    shippingFee: d.shippingFee != null ? Number(d.shippingFee) : fb.store.shippingFee,
    currency: d.currency || fb.store.currency,
  };
}

// Newest first (drives "New Arrivals"). Falls back to the static catalog when Strapi is empty/down.
export async function getProducts(): Promise<StoreProduct[]> {
  const rows = await list(
    "products",
    "populate=*&sort=createdAt:desc&pagination[pageSize]=100",
  );
  return rows.length ? rows.map(mapProduct) : fb.storeProducts;
}

export async function getProduct(slug: string): Promise<StoreProduct | null> {
  const row = await one(
    "products",
    `filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`,
  );
  if (row) return mapProduct(row);
  return fb.storeProducts.find((p) => p.slug === slug) ?? null;
}

// Editor-managed store categories (drives the storefront filter tabs), ordered.
export async function getCategories(): Promise<Category[]> {
  const rows = await list("categories", "sort=order:asc&pagination[pageSize]=100");
  return rows.length
    ? rows.map((c: any) => ({ slug: c.slug, name: c.name }))
    : fb.categories;
}
