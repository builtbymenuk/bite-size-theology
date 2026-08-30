// The Strapi seam. Each getX() fetches its Strapi Single Type and normalizes the
// v5 response into the exact shape from content.ts. On ANY failure — STRAPI_URL
// unset, Strapi down, non-200, bad JSON, empty fields — it falls back to the
// static const in content.ts. The site is unbreakable by construction.
//
// Field naming here MUST match the Strapi schemas in cms/src/api/**. Nested
// objects (calling.rooted, collection.quote, contact.email/form, ...) are flat
// prefixed scalars in Strapi and get reassembled below.

import * as fb from "./content";
import { getYouTubeVideos } from "./youtube";
import type {
  SocialPlatform,
  Nav, Hero, Calling, AllThings, UpcomingBook, Collection, Podcast, PodcastPage,
  Faq, Footer, About, Contact, BookCaleb, Prayer, ThemeColors, Donate, Tour, StoreProduct, Store, Category,
} from "./content";

const BASE = process.env.STRAPI_URL;
// Public origin the BROWSER uses for Strapi media. In split-host setups (Docker, a reverse proxy,
// or a box that can't reach its own public IP) server-side fetch goes to BASE (e.g. http://cms:1337)
// while <img> src must point at a browser-reachable host. Falls back to BASE when unset.
const PUBLIC_BASE = process.env.STRAPI_PUBLIC_URL || BASE;
const TOKEN = process.env.STRAPI_API_TOKEN;

// Dev: fetch fresh every request so Strapi edits show on the next reload. Prod: 5-min ISR
// window (a Strapi webhook → /api/revalidate can invalidate sooner — see that route).
// Override with STRAPI_REVALIDATE (seconds); 0 = always fresh/dynamic (e.g. a live-edit demo).
const rawRev = process.env.STRAPI_REVALIDATE;
const REVALIDATE =
  rawRev != null && rawRev !== "" && Number.isFinite(Number(rawRev))
    ? Number(rawRev)
    : process.env.NODE_ENV === "development"
      ? 0
      : 300;

// Strapi media URLs are relative on local (/uploads/..); next/image needs absolute.
// Provider URLs (S3/Cloudinary) already start with http and pass through.
const absolutize = (u?: string): string | undefined =>
  u ? (u.startsWith("http") ? u : `${PUBLIC_BASE}${u}`) : undefined;

// Use a mapped CMS array only when it actually has rows, else keep the fallback.
function arr<T>(x: unknown, map: (v: any, i: number) => T, fallback: T[]): T[] {
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

// The hero's social icons. Six flat fields on the hero single type collapse to one array here.
// Blanks are KEPT, not dropped: the row always shows all six so it reads as a complete set, and
// SocialLinks renders the ones without a URL as dimmed, non-clickable placeholders that go live as
// each field is filled in.
const SOCIAL_FIELDS: [SocialPlatform, string][] = [
  ["instagram", "urlInstagram"],
  ["youtube", "urlYoutube"],
  ["tiktok", "urlTiktok"],
  ["facebook", "urlFacebook"],
  ["x", "urlX"],
  ["spotify", "urlSpotify"],
];

export async function getNav(): Promise<Nav> {
  const d = await single("nav");
  if (!d) return fb.nav;
  return {
    logo: d.logo || fb.nav.logo,
    cta: d.cta || fb.nav.cta,
    links: arr(d.links, (l) => ({ label: l.label, url: l.url || "" }), fb.nav.links),
  };
}

export async function getHero(): Promise<Hero> {
  const d = await single("hero");
  if (!d) return fb.hero;
  return {
    ...fb.hero, // keeps titleLines (design token)
    socials: SOCIAL_FIELDS.map(([platform, field]) => ({
      platform,
      url: String(d[field] ?? "").trim(),
    })),
    tagline: d.tagline || fb.hero.tagline,
    subtext: d.subtext || fb.hero.subtext,
    cta: d.cta || fb.hero.cta,
    ctaUrl: d.ctaUrl || fb.hero.ctaUrl,
    bgImage: absolutize(d.bgImage?.url) || fb.hero.bgImage,
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
    images: {
      bible: absolutize(d.imgBible?.url) || fb.calling.images?.bible,
      scripture: absolutize(d.imgScripture?.url) || fb.calling.images?.scripture,
    },
  };
}

export async function getAllThings(): Promise<AllThings> {
  const d = await single("all-thing"); // populate=* to also pull the tile photos
  if (!d) return fb.allThings;
  return {
    ...fb.allThings, // keeps the 8 fixed `cards` layout slots
    headingLead: d.headingLead || fb.allThings.headingLead,
    headingScript: d.headingScript || fb.allThings.headingScript,
    subtext: d.subtext || fb.allThings.subtext,
    images: {
      testimony: absolutize(d.imgTestimony?.url) || fb.allThings.images?.testimony,
      vlog: absolutize(d.imgVlog?.url) || fb.allThings.images?.vlog,
      youtube: absolutize(d.imgYoutube?.url) || fb.allThings.images?.youtube,
      tiktok: absolutize(d.imgTiktok?.url) || fb.allThings.images?.tiktok,
      shop: absolutize(d.imgShop?.url) || fb.allThings.images?.shop,
      podcast: absolutize(d.imgPodcast?.url) || fb.allThings.images?.podcast,
      book: absolutize(d.imgBook?.url) || fb.allThings.images?.book,
    },
    links: {
      testimony: d.urlTestimony || fb.allThings.links.testimony,
      youtube: d.urlYoutube || fb.allThings.links.youtube,
      tiktok: d.urlTiktok || fb.allThings.links.tiktok,
      shop: d.urlShop || fb.allThings.links.shop,
      podcast: d.urlPodcast || fb.allThings.links.podcast,
      book: d.urlBook || fb.allThings.links.book,
      give: d.urlGive || fb.allThings.links.give,
    },
  };
}

export async function getUpcomingBook(): Promise<UpcomingBook> {
  // `populate=*` would return the product relation as a bare row with no images/category, so the
  // relation is populated one level deeper — that row is what the store band prices and sells.
  const d = await single(
    "upcoming-book",
    "populate[image]=true&populate[product][populate]=*",
  );
  if (!d) return fb.upcomingBook;
  return {
    // Coerce, don't `||` — that would drop an editor's explicit `false` (toggle OFF).
    visible: !!d.visible,
    product: d.product ? mapProduct(d.product) : undefined,
    eyebrow: d.eyebrow || fb.upcomingBook.eyebrow,
    title: d.title || fb.upcomingBook.title,
    subtitle: d.subtitle || fb.upcomingBook.subtitle,
    body: d.body || fb.upcomingBook.body,
    releaseLabel: d.releaseLabel || fb.upcomingBook.releaseLabel,
    cta: d.cta || fb.upcomingBook.cta,
    ctaUrl: d.ctaUrl || fb.upcomingBook.ctaUrl,
    image: absolutize(d.image?.url) || fb.upcomingBook.image,
  };
}

export async function getCollection(): Promise<Collection> {
  const d = await single("collection", "populate[products][populate]=image");
  if (!d) return fb.collection;
  return {
    eyebrow: d.eyebrow || fb.collection.eyebrow,
    heading: d.heading || fb.collection.heading,
    link: d.link || fb.collection.link,
    linkUrl: d.linkUrl || fb.collection.linkUrl,
    products: arr(
      d.products,
      (p, i) => ({
        name: p.name,
        price: p.price,
        tag: p.tag || undefined,
        tone: p.tone,
        image: absolutize(p.image?.url) || fb.collection.products[i]?.image,
        url: p.url || undefined,
      }),
      fb.collection.products,
    ),
    quote: {
      text: d.quoteText || fb.collection.quote.text,
      body: d.quoteBody || fb.collection.quote.body,
      cta: d.quoteCta || fb.collection.quote.cta,
      ctaUrl: d.quoteCtaUrl || fb.collection.quote.ctaUrl,
    },
  };
}

// Latest YouTube uploads → wall tiles (thumbnail + clickable watch link + title).
const ytTiles = (vids: Awaited<ReturnType<typeof getYouTubeVideos>>) =>
  vids.map((v) => ({ image: v.thumbnail, url: v.url, title: v.title }));

export async function getPodcast(): Promise<Podcast> {
  // Strapi v5 populate=* is one level deep — it misses media nested in a repeatable component, so the
  // episode wall's images never populate. Deep-populate episodes (incl. their image) + actions explicitly.
  const d = await single("podcast", "populate[episodes][populate]=*&populate[actions]=*");
  if (!d) {
    // Strapi down → still auto-fill the wall from the fallback channel.
    const vids = await getYouTubeVideos(fb.podcast.youtubeChannelId);
    return vids.length ? { ...fb.podcast, episodes: ytTiles(vids) } : fb.podcast;
  }
  // "" = editor cleared it → off (use manual episodes); null/absent = never set → fall back to the
  // known channel so the wall still auto-fills.
  const channelId =
    d.youtubeChannelId != null ? d.youtubeChannelId : fb.podcast.youtubeChannelId;
  const cmsEpisodes = arr(
    d.episodes,
    (e) => ({
      image: absolutize(e.image?.url),
      url: e.url || undefined,
      title: e.title || undefined,
    }),
    fb.podcast.episodes,
  );
  // Precedence: YouTube (channel set + fetch ok) → hand-edited CMS episodes → gallery tones.
  const vids = channelId ? await getYouTubeVideos(channelId) : [];
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
      (a) => ({ label: a.label, platform: a.platform, url: a.url || undefined }),
      fb.podcast.actions,
    ),
    episodes: vids.length ? ytTiles(vids) : cmsEpisodes,
    youtubeChannelId: channelId || undefined,
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
    cta: {
      pills: arr(d.ctaPills, (p) => p.value, fb.podcastPage.cta.pills),
      headingLead: d.ctaHeadingLead || fb.podcastPage.cta.headingLead,
      headingAccent: d.ctaHeadingAccent || fb.podcastPage.cta.headingAccent,
      body: d.ctaBody || fb.podcastPage.cta.body,
    },
    series: {
      // `??` not `!!` — this boolean is new on a single type that already has a row everywhere,
      // so it reads back null. `!!null` would hide the section even after a playlist is pasted.
      // Never-set = on; an explicit false from the admin still hides it.
      visible: d.seriesVisible ?? true,
      eyebrow: d.seriesEyebrow || fb.podcastPage.series.eyebrow,
      headingLead: d.seriesHeadingLead || fb.podcastPage.series.headingLead,
      headingAccent: d.seriesHeadingAccent || fb.podcastPage.series.headingAccent,
      body: d.seriesBody || fb.podcastPage.series.body,
      cta: d.seriesCta || fb.podcastPage.series.cta,
      ctaUrl: d.seriesCtaUrl || fb.podcastPage.series.ctaUrl,
      // Blank strings, not undefined: a half-filled card is a legitimate state (an editor pastes
      // the video before the playlist), and the grid branches on `video` being empty.
      items: arr(
        d.seriesItems,
        (v) => ({
          title: v.title || "",
          video: v.video || "",
          playlist: v.playlist || "",
          note: v.note || "",
        }),
        fb.podcastPage.series.items,
      ),
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
    supportCtaUrl: d.supportCtaUrl || fb.faq.supportCtaUrl,
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
      (c) => ({
        title: c.title,
        links: arr(c.links, (l: any) => ({ label: l.label, url: l.url || "" }), []),
      }),
      fb.footer.columns,
    ),
    messageLead: d.messageLead || fb.footer.messageLead,
    messageWord: d.messageWord || fb.footer.messageWord,
    messageBody: d.messageBody || fb.footer.messageBody,
    wordmark: d.wordmark || fb.footer.wordmark,
    copyright: d.copyright || fb.footer.copyright,
    legal: arr(d.legal, (l) => ({ label: l.label, url: l.url || "" }), fb.footer.legal),
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
    donateCtaUrl: d.donateCtaUrl || fb.about.donateCtaUrl,
    intro: d.intro || fb.about.intro,
    turnLead: d.turnLead || fb.about.turnLead,
    story: arr(d.story, (p) => p.value, fb.about.story),
    missionLabel: d.missionLabel || fb.about.missionLabel,
    quote: {
      text: d.quoteText || fb.about.quote.text,
      attribution: d.quoteAttribution || fb.about.quote.attribution,
    },
    images: {
      hero: { ...fb.about.images.hero, src: absolutize(d.heroImage?.url) || fb.about.images.hero.src },
      turn: { ...fb.about.images.turn, src: absolutize(d.turnImage?.url) || fb.about.images.turn.src },
      mission: { ...fb.about.images.mission, src: absolutize(d.missionImage?.url) || fb.about.images.mission.src },
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
      (s) => ({ name: s.name, handle: s.handle, url: s.url || undefined }),
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

export async function getBookCaleb(): Promise<BookCaleb> {
  const d = await single("book-caleb");
  if (!d) return fb.bookCaleb;
  const f = fb.bookCaleb;
  const opts = (v: unknown, fallback: string[]) => arr(v, (o) => o.value, fallback);
  return {
    headingLead: d.headingLead || f.headingLead,
    headingScript: d.headingScript || f.headingScript,
    intro: d.intro || f.intro,
    responseNote: d.responseNote || f.responseNote,
    directEmail: {
      label: d.directEmailLabel || f.directEmail.label,
      address: d.directEmailAddress || f.directEmail.address,
    },
    form: {
      heading: d.formHeading || f.form.heading,
      subheading: d.formSubheading || f.form.subheading,
      tabChurch: d.tabChurch || f.form.tabChurch,
      tabCorporate: d.tabCorporate || f.form.tabCorporate,
      submit: d.formSubmit || f.form.submit,
      note: d.formNote || f.form.note,
      success: d.formSuccess || f.form.success,
      eventTypeOptions: opts(d.eventTypeOptions, f.form.eventTypeOptions),
      corporateEventTypes: opts(d.corporateEventTypes, f.form.corporateEventTypes),
      attendanceOptions: opts(d.attendanceOptions, f.form.attendanceOptions),
      industryOptions: opts(d.industryOptions, f.form.industryOptions),
      budgetOptions: opts(d.budgetOptions, f.form.budgetOptions),
      heardAboutOptions: opts(d.heardAboutOptions, f.form.heardAboutOptions),
      timelineOptions: opts(d.timelineOptions, f.form.timelineOptions),
    },
  };
}

// Admin-editable recipient overrides for the three forms. Read UNCACHED (no-store) so a change in
// the admin applies on the very next submission. Server-only (token'd); never exposed publicly.
// Any failure → {} so the routes fall back to their env vars exactly as before.
export interface NotificationSettings {
  contactTo?: string;
  bookingTo?: string;
  prayerTo?: string;
}
export async function getNotificationSettings(): Promise<NotificationSettings> {
  if (!BASE) return {};
  try {
    const res = await fetch(`${BASE}/api/notification-settings`, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      cache: "no-store",
    });
    if (!res.ok) return {};
    const d = (await res.json())?.data;
    if (!d) return {};
    const t = (v: unknown) => {
      const s = String(v ?? "").trim();
      return s || undefined;
    };
    return { contactTo: t(d.contactTo), bookingTo: t(d.bookingTo), prayerTo: t(d.prayerTo) };
  } catch {
    return {};
  }
}

// Admin-editable theme colors → override the Tailwind @theme tokens at runtime (see layout.tsx).
// Each field is validated as a hex; empty/invalid falls back to the brand default so a typo in the
// admin can never break the site.
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
export async function getThemeColors(): Promise<ThemeColors> {
  const d = await single("theme-setting");
  const pick = (v: unknown, fallback: string) => {
    const s = String(v ?? "").trim();
    return HEX.test(s) ? s : fallback;
  };
  return {
    paper: pick(d?.paper, fb.themeColors.paper),
    ink: pick(d?.ink, fb.themeColors.ink),
    accent: pick(d?.accent, fb.themeColors.accent),
    darkSection: pick(d?.darkSection, fb.themeColors.darkSection),
    blue: pick(d?.blue, fb.themeColors.blue),
  };
}

export async function getPrayer(): Promise<Prayer> {
  const d = await single("prayer");
  if (!d) return fb.prayer;
  return {
    headingLead: d.headingLead || fb.prayer.headingLead,
    headingScript: d.headingScript || fb.prayer.headingScript,
    intro: d.intro || fb.prayer.intro,
    privacyNote: d.privacyNote || fb.prayer.privacyNote,
    assurance: {
      heading: d.assuranceHeading || fb.prayer.assurance.heading,
      body: d.assuranceBody || fb.prayer.assurance.body,
    },
    form: {
      heading: d.formHeading || fb.prayer.form.heading,
      subheading: d.formSubheading || fb.prayer.form.subheading,
      fields: {
        name: d.fieldName || fb.prayer.form.fields.name,
        email: d.fieldEmail || fb.prayer.form.fields.email,
        request: d.fieldRequest || fb.prayer.form.fields.request,
      },
      urgentLabel: d.urgentLabel || fb.prayer.form.urgentLabel,
      submit: d.formSubmit || fb.prayer.form.submit,
    },
  };
}

export async function getDonate(): Promise<Donate> {
  const d = await single("donate"); // populate=* covers presets, fundOptions, impactStats, heroImage
  if (!d) return fb.donate;
  return {
    heroEyebrow: d.heroEyebrow || fb.donate.heroEyebrow,
    heroHeading: d.heroHeading || fb.donate.heroHeading,
    heroAccent: d.heroAccent || fb.donate.heroAccent,
    heroSubtext: d.heroSubtext || fb.donate.heroSubtext,
    heroImage: absolutize(d.heroImage?.url) || fb.donate.heroImage,
    presets: arr(d.presets, (p) => p.value, fb.donate.presets),
    fundOptions: arr(d.fundOptions, (f) => f.value, fb.donate.fundOptions),
    impactHeading: d.impactHeading || fb.donate.impactHeading,
    impactStats: arr(
      d.impactStats,
      (s) => ({ value: s.value, label: s.label, icon: s.icon }),
      fb.donate.impactStats,
    ),
    proceedsNote: d.proceedsNote || fb.donate.proceedsNote,
    assuranceTitle: d.assuranceTitle || fb.donate.assuranceTitle,
    assuranceBody: d.assuranceBody || fb.donate.assuranceBody,
    thankYouHeading: d.thankYouHeading || fb.donate.thankYouHeading,
    thankYouBody: d.thankYouBody || fb.donate.thankYouBody,
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
    heroImageSrc: absolutize(d.heroPhoto?.url) || fb.tour.heroImageSrc,
    secondImageSrc: absolutize(d.secondPhoto?.url) || fb.tour.secondImageSrc,
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
  const images = Array.isArray(p.images)
    ? (p.images.map((m: any) => absolutize(m?.url)).filter(Boolean) as string[])
    : [];
  return {
    slug: p.slug,
    title: p.title,
    description: p.description || "",
    price: Number(p.price) || 0,
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : undefined,
    // No Strapi media uploaded → fall back to the matching static mockup (same || fb.x seam
    // as the rest of cms.ts). Real uploads override; unknown slugs just stay empty.
    images: images.length
      ? images
      : fb.storeProducts.find((s) => s.slug === p.slug)?.images ?? [],
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
    proceedsBanner: d.proceedsBanner || fb.store.proceedsBanner,
    bestSellersHeading: d.bestSellersHeading || fb.store.bestSellersHeading,
    newArrivalsHeading: d.newArrivalsHeading || fb.store.newArrivalsHeading,
    founderEyebrow: d.founderEyebrow || fb.store.founderEyebrow,
    founderHeading: d.founderHeading || fb.store.founderHeading,
    founderBody: d.founderBody || fb.store.founderBody,
    founderCta: d.founderCta || fb.store.founderCta,
    founderCtaUrl: d.founderCtaUrl || fb.store.founderCtaUrl,
    founderImage: absolutize(d.founderImage?.url) || fb.store.founderImage,
    shippingFee: d.shippingFee != null ? Number(d.shippingFee) : fb.store.shippingFee,
    currency: d.currency || fb.store.currency,
    // ?? not ||: an explicit `false` from the CMS is what opens the shop.
    comingSoon: d.comingSoon ?? fb.store.comingSoon,
    comingSoonMessage: d.comingSoonMessage || fb.store.comingSoonMessage,
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
