import seedData from "./seed-data.json";

// Single types (singularName == the api uid segment == the path cms.ts fetches).
// `store` is the storefront's editorial single type; the rest are the marketing pages.
const NAMES = [
  "nav", "hero", "eyebrow", "calling", "all-thing", "upcoming-book", "collection", "podcast",
  "podcast-page", "faq", "footer", "about", "contact", "book-caleb", "prayer", "theme-setting", "donate", "tour",
  "store",
];

// Publicly-readable collection types need BOTH find + findOne. Products + categories are public;
// `order` is intentionally absent — orders are written only via a server API token.
const PUBLIC_COLLECTIONS = ["product", "category"];

// Every public-read action to grant on the public role.
const GRANTS = [
  ...NAMES.map((n) => `api::${n}.${n}.find`),
  ...PUBLIC_COLLECTIONS.flatMap((n) => [`api::${n}.${n}.find`, `api::${n}.${n}.findOne`]),
];

// Friendly edit-view labels/help-text for the cryptic fields. Keyed by singularName → field.
// Applied to strapi_core_store_settings in bootstrap (step 3), only over still-default labels.
const LABELS: Record<string, Record<string, { label?: string; description?: string }>> = {
  nav: {
    links: { label: "Nav links", description: "Labels only — the routes are set in code" },
    cta: { label: "Donate button text" },
  },
  hero: {
    bgImage: { label: "Background image (optional)", description: "Falls back to a dark gradient if empty" },
    // The social icons render in the hero's top-right corner, so their URLs live on the hero.
    urlInstagram: { label: "Instagram URL", description: "Blank = the icon shows greyed out and unclickable" },
    urlYoutube: { label: "YouTube URL", description: "Blank = the icon shows greyed out and unclickable" },
    urlTiktok: { label: "TikTok URL", description: "Blank = the icon shows greyed out and unclickable" },
    urlFacebook: { label: "Facebook URL", description: "Blank = the icon shows greyed out and unclickable" },
    urlX: { label: "X / Twitter URL", description: "Blank = the icon shows greyed out and unclickable" },
    urlSpotify: { label: "Spotify URL", description: "Blank = the icon shows greyed out and unclickable" },
  },
  calling: {
    headingScript: { label: "Heading — script word", description: 'The italic gold word (e.g. "The")' },
    heading: { label: "Heading — main word" },
    introLabel: { label: "Intro label", description: 'e.g. "Hi, I\'m Caleb Griffith"' },
    body: { label: "Body paragraphs" },
    rootedTitle: { label: "Rooted card — Title" },
    rootedBody: { label: "Rooted card — Body" },
    imgBible: { label: "Photo — Open Bible", description: "Front polaroid; empty shows a placeholder" },
    imgScripture: { label: "Photo — Scripture", description: "Back polaroid; empty shows a placeholder" },
  },
  "all-thing": {
    headingLead: { label: "Heading — lead" },
    headingScript: { label: "Heading — script word (italic)" },
    imgTestimony: { label: "Photo — Testimony (polaroid)" },
    imgVlog: { label: "Photo — Vlog (polaroid)" },
    imgYoutube: { label: "Photo — YouTube card" },
    imgTiktok: { label: "Photo — TikTok card" },
    imgShop: { label: "Photo — Shop card" },
    imgPodcast: { label: "Photo — Podcast card" },
    imgBook: { label: "Photo — Book Caleb card" },
    urlTestimony: { label: "Link — Testimony tile", description: "Full https:// or /page; blank = not clickable" },
    urlYoutube: { label: "Link — YouTube tile", description: "Full https:// or /page; blank = not clickable" },
    urlTiktok: { label: "Link — TikTok tile", description: "Full https:// or /page; blank = not clickable" },
    urlShop: { label: "Link — Shop tile", description: "Full https:// or /page; blank = not clickable" },
    urlPodcast: { label: "Link — Podcast tile", description: "Full https:// or /page; blank = not clickable" },
    urlBook: { label: "Link — Book Caleb tile", description: "Full https:// or /page; blank = not clickable" },
    urlGive: { label: "Link — Give tile", description: "Full https:// or /page; blank = not clickable" },
  },
  "upcoming-book": {
    visible: { label: "Show on homepage", description: "Off until the book is published — tick to make the section visible" },
    showInStore: { label: "Show on shop page", description: "Tick to feature the book at the top of the shop, above Best Sellers" },
    product: { label: "Shop product", description: "The book's store product — supplies the price and the Add-to-cart button. Edit price/cover under Store — Products" },
    eyebrow: { label: "Eyebrow", description: 'Small label above the title, e.g. "Coming Soon"' },
    title: { label: "Book title" },
    subtitle: { label: "Subtitle / tagline" },
    body: { label: "Description" },
    releaseLabel: { label: "Release label", description: 'e.g. "Fall 2026"' },
    cta: { label: "Button text" },
    image: { label: "Cover image" },
  },
  collection: {
    link: { label: '"Explore all" link text' },
    quoteText: { label: "Quote — Text" },
    quoteBody: { label: "Quote — Body" },
    quoteCta: { label: "Quote — Button" },
  },
  podcast: {
    note: { label: "Small note (top-right)" },
    badgeRank: { label: "Badge — Rank", description: "e.g. #1 Podcast" },
    badgeCategory: { label: "Badge — Category", description: "e.g. Religion" },
    youtubeChannelId: {
      label: "YouTube channel ID (UC…)",
      description: "Auto-fills the video wall with the channel's latest videos. Clear to use manual episodes instead.",
    },
  },
  "podcast-page": {
    heroName: { label: "Hero — Name" },
    heroHeading: { label: "Hero — Heading" },
    heroHeadingAccent: { label: "Hero — Accent word", description: "Shown italic/gold" },
    heroSubtext: { label: "Hero — Subtext" },
    ctaHeadingLead: { label: "CTA — Heading lead" },
    ctaHeadingAccent: { label: "CTA — Accent word" },
    ctaBody: { label: "CTA — Body" },
    ctaPills: { label: "CTA — Keyword pills" },
    seriesVisible: { label: "Series — Show this section", description: "Uncheck to hide the preaching-series cards" },
    seriesEyebrow: { label: "Series — Eyebrow" },
    seriesHeadingLead: { label: "Series — Heading lead" },
    seriesHeadingAccent: { label: "Series — Accent word", description: "Shown italic/gold" },
    seriesBody: { label: "Series — Body" },
    seriesCta: { label: "Series — Button text" },
    seriesCtaUrl: { label: "Series — Button link" },
    seriesItems: { label: "Series — Cards", description: "One card per preaching series. Paste the YouTube video link (the card's thumbnail + player) and the playlist link. Leave the video blank for a \"Coming soon\" placeholder." },
  },
  faq: {
    supportEyebrow: { label: "Support — Eyebrow" },
    supportHeading: { label: "Support — Heading" },
    supportBody: { label: "Support — Body" },
    supportCta: { label: "Support — Button" },
    headingLead: { label: "Heading — lead" },
    headingScript: { label: "Heading — script word (italic)" },
  },
  footer: {
    messageLead: { label: "Message — lead" },
    messageWord: { label: "Message — accent word", description: "e.g. HOPE." },
    messageBody: { label: "Message — body" },
    wordmark: { label: "Big wordmark", description: "The giant text along the bottom" },
  },
  about: {
    headingLead: { label: "Heading — lead (e.g. Meet)" },
    headingName: { label: "Heading — name (bold italic)" },
    turnLead: { label: "Turn section — heading", description: 'e.g. "But, God!"' },
    story: { label: "Story paragraphs", description: "¶1 = the turn, ¶2 = the mission" },
    missionLabel: { label: "Mission — label" },
    quoteText: { label: "Pull-quote — Text" },
    quoteAttribution: { label: "Pull-quote — Attribution" },
  },
  contact: {
    headingLead: { label: "Heading — lead" },
    headingScript: { label: "Heading — script word (italic)" },
    emailLabel: { label: "Email — Label" },
    emailAddress: { label: "Email — Address" },
    emailNote: { label: "Email — Note" },
    mailingLabel: { label: "Mailing — Label" },
    mailingLines: { label: "Mailing — Address lines" },
    fieldName: { label: "Form placeholder — Name" },
    fieldEmail: { label: "Form placeholder — Email" },
    fieldSubject: { label: "Form placeholder — Subject" },
    fieldMessage: { label: "Form placeholder — Message" },
    subjectOptions: { label: "Form — Subject dropdown options" },
    formHeading: { label: "Form — Heading" },
    formSubheading: { label: "Form — Subheading" },
    formSubmit: { label: "Form — Submit button" },
    formSuccess: { label: "Form — Success message" },
  },
  "book-caleb": {
    headingLead: { label: "Heading — lead" },
    headingScript: { label: "Heading — script word (italic)" },
    intro: { label: "Intro paragraph" },
    responseNote: { label: "Response note", description: 'Shown under "What to expect"' },
    directEmailLabel: { label: "Direct email — Label" },
    directEmailAddress: { label: "Direct email — Address" },
    formHeading: { label: "Form — Heading" },
    formSubheading: { label: "Form — Subheading" },
    tabChurch: { label: "Form — Church tab label" },
    tabCorporate: { label: "Form — Corporate tab label" },
    formSubmit: { label: "Form — Submit button" },
    formNote: { label: "Form — Small print under the button" },
    formSuccess: { label: "Form — Success message" },
    eventTypeOptions: { label: "Dropdown — Event type (church tab)" },
    corporateEventTypes: { label: "Dropdown — Event type (corporate tab)" },
    attendanceOptions: {
      label: "Dropdown — Size ranges",
      description: "Shared by every how-many-people question: weekend attendance, expected attendance, organization size.",
    },
    industryOptions: { label: "Dropdown — Industry / type (corporate tab)" },
    budgetOptions: { label: "Dropdown — Speaking fee budget (corporate tab)" },
    heardAboutOptions: { label: "Dropdown — How did you hear about Caleb?" },
    timelineOptions: { label: "Dropdown — Decision timeline (corporate tab)" },
  },
  "booking-request": {
    name: { label: "Name" },
    audience: { label: "Audience", description: "Which form tab the request came from — church or corporate." },
    role: { label: "Role / title" },
    orgWebsite: { label: "Website" },
    details: { label: "Other answers", description: "The tab-specific answers (size, budget, travel, timeline, …) in one block." },
    organization: { label: "Church / Organization" },
    eventType: { label: "Event type" },
    eventDate: { label: "Preferred date(s)" },
    audienceSize: { label: "Estimated audience size" },
    handled: { label: "Handled", description: "Tick once you've followed up on this request" },
  },
  prayer: {
    headingLead: { label: "Heading — lead" },
    headingScript: { label: "Heading — script word (italic)" },
    intro: { label: "Intro paragraph" },
    privacyNote: { label: "Privacy note", description: "Reassurance shown under the form" },
    assuranceHeading: { label: "Confirmation — Heading", description: "Shown after a request is sent" },
    assuranceBody: { label: "Confirmation — Body / verse" },
    formHeading: { label: "Form — Heading" },
    formSubheading: { label: "Form — Subheading" },
    fieldName: { label: "Form placeholder — Name" },
    fieldEmail: { label: "Form placeholder — Email" },
    fieldRequest: { label: "Form placeholder — Request" },
    urgentLabel: { label: "Checkbox — Urgent label" },
    formSubmit: { label: "Form — Submit button" },
  },
  "prayer-request": {
    request: { label: "Prayer request" },
    urgent: { label: "Urgent" },
    handled: { label: "Handled", description: "Tick once the prayer team has followed up" },
  },
  "notification-settings": {
    contactTo: { label: "Contact form → email", description: "Where Contact submissions are sent. Blank = server default." },
    bookingTo: { label: "Book Caleb form → email", description: "Where booking requests are sent. Blank = server default." },
    prayerTo: { label: "Prayer form → email", description: "Where prayer requests are sent. Blank = server default." },
  },
  donate: {
    heroEyebrow: { label: "Hero — Eyebrow" },
    heroHeading: { label: "Hero — Heading" },
    heroAccent: { label: "Hero — Accent word (plum italic)" },
    heroSubtext: { label: "Hero — Subtext" },
    heroImage: { label: "Hero — Image (optional)" },
    presets: { label: "Suggested amounts", description: "Dollar values only, e.g. 50" },
    fundOptions: { label: "Fund / designation options" },
    impactHeading: { label: "Impact — Heading" },
    impactStats: { label: "Impact — Stats", description: "Value + label + icon (mic/globe/award)" },
    proceedsNote: { label: "Proceeds banner text" },
    assuranceTitle: { label: "Assurance — Title" },
    assuranceBody: { label: "Assurance — Body" },
    thankYouHeading: { label: "Thank-you — Heading" },
    thankYouBody: { label: "Thank-you — Body / verse" },
  },
  donation: {
    amount: { label: "Amount" },
    fund: { label: "Fund / designation" },
    anonymous: { label: "Anonymous" },
    provider: { label: "Payment provider" },
    recurring: { label: "Recurring", description: "Reserved for future monthly giving" },
  },
  "theme-setting": {
    paper: { label: "Background (paper)", description: "Hex, e.g. #EDF1F7. Blank = brand default." },
    ink: { label: "Text & dark (navy)", description: "Hex, e.g. #0E2038. Main text + darkest fills." },
    accent: { label: "Accent (plum)", description: "Hex, e.g. #B0577C. Script words, badges, hovers." },
    darkSection: { label: "Dark sections (navy)", description: "Hex, e.g. #16294C. Hero, footer, buttons." },
    blue: { label: "Links & buttons (blue)", description: "Hex, e.g. #2563AD. Donate CTA, links." },
  },
  tour: {
    regions: { label: "Tour regions", description: "Each region has an optional heading + code, and a list of dates" },
  },
  store: {
    heroEyebrow: { label: "Hero — Eyebrow" },
    heroHeading: { label: "Hero — Heading", description: 'e.g. "Christian Apparel With Purpose"' },
    heroSubtext: { label: "Hero — Subtext" },
    heroCta: { label: "Hero — Button" },
    heroImage: { label: "Hero — Background image (optional)" },
    proceedsBanner: { label: "Proceeds banner", description: "The scrolling strip, e.g. 10% of proceeds support mission work" },
    bestSellersHeading: { label: "Best sellers — Heading" },
    newArrivalsHeading: { label: "New arrivals — Heading" },
    founderEyebrow: { label: "Founder — Eyebrow" },
    founderHeading: { label: "Founder — Heading" },
    founderBody: { label: "Founder — Body" },
    founderCta: { label: "Founder — Button" },
    founderImage: { label: "Founder — Image (optional)" },
    shippingFee: { label: "Flat shipping fee (USD)", description: "Added to every order. Set 0 for free shipping." },
    currency: { label: "Currency code", description: "e.g. USD" },
  },
  category: {
    name: { label: "Category name" },
    slug: { label: "URL slug", description: "Auto-fills from the name; used by the store filter" },
    order: { label: "Sort order", description: "Lower numbers appear first in the filter tabs" },
  },
  order: {
    provider: { label: "Payment provider", description: "paypal or stripe — set automatically" },
    stripeSessionId: { label: "Stripe session id" },
    stripePaymentIntentId: { label: "Stripe payment id" },
  },
  product: {
    title: { label: "Product name" },
    slug: { label: "URL slug", description: "Auto-fills from the name; used in the product page URL" },
    price: { label: "Price (USD)" },
    compareAtPrice: { label: "Compare-at price (optional)", description: "Original price, shown struck-through for sales" },
    images: { label: "Images", description: "The first image is the main one" },
    sizes: { label: "Sizes", description: "Leave empty for one-size items (no size picker)" },
    badge: { label: "Card badge (optional)", description: 'e.g. "New Arrival" or "Sale"' },
    featured: { label: "Featured", description: "Show in the Best Sellers row" },
    soldOut: { label: "Sold out", description: "Hides the Add-to-cart button" },
  },
};

export default {
  register() {},

  // Runs on every startup. Both steps are idempotent (guarded), so this is safe to leave in.
  async bootstrap({ strapi }: { strapi: any }) {
    // 1. Public read for every single type — this is published marketing content shown on a
    //    public site, so `find` on the public role is appropriate (no token needed for local dev;
    //    set STRAPI_API_TOKEN + lock this down in production).
    try {
      const publicRole = await strapi
        .query("plugin::users-permissions.role")
        .findOne({ where: { type: "public" } });
      if (publicRole) {
        for (const action of GRANTS) {
          const existing = await strapi
            .query("plugin::users-permissions.permission")
            .findOne({ where: { action, role: publicRole.id } });
          if (!existing) {
            await strapi
              .query("plugin::users-permissions.permission")
              .create({ data: { action, role: publicRole.id } });
          }
        }
      }
    } catch (e) {
      strapi.log.error("seed: failed granting public read permissions");
      strapi.log.error(e);
    }

    // 2. Seed each single type from the current content.ts values, once. Skips any type that
    //    already has an entry, so editor changes are never overwritten on restart.
    // one-shot seed guarded by findFirst — leave it, it no-ops after the first run.
    try {
      for (const name of NAMES) {
        const uid = `api::${name}.${name}`;
        const existing = await strapi.documents(uid).findFirst();
        if (existing) continue;
        const data = (seedData as Record<string, any>)[name];
        if (!data) continue;
        await strapi.documents(uid).create({ data });
        strapi.log.info(`seed: created ${uid}`);
      }
    } catch (e) {
      strapi.log.error("seed: failed creating content");
      strapi.log.error(e);
    }

    // 2b. Store categories + products. Categories are find-or-create by slug (idempotent). Products
    //     are seeded once and linked to their category by slug; the link step also runs as a backfill
    //     so already-seeded sample products pick up the relation after the enum→relation change.
    try {
      const cats = (seedData as Record<string, any>).categories ?? [];
      const products = (seedData as Record<string, any>).products ?? [];
      const catId: Record<string, string> = {};
      for (const c of cats) {
        let row = await strapi
          .documents("api::category.category")
          .findFirst({ filters: { slug: c.slug } });
        if (!row) {
          row = await strapi.documents("api::category.category").create({ data: c });
          strapi.log.info(`seed: created category ${c.slug}`);
        }
        catId[c.slug] = row.documentId;
      }

      const first = await strapi.documents("api::product.product").findFirst();
      if (!first && Array.isArray(products)) {
        for (const p of products) {
          const { category, ...rest } = p; // `category` is a slug string in seed-data → link below
          await strapi.documents("api::product.product").create({
            data: { ...rest, ...(catId[category] ? { category: catId[category] } : {}) },
          });
        }
        strapi.log.info(`seed: created ${products.length} products`);
      } else if (Array.isArray(products)) {
        // Backfill: link the category relation on any existing seeded product still missing it.
        for (const p of products) {
          if (!catId[p.category]) continue;
          const row = await strapi
            .documents("api::product.product")
            .findFirst({ filters: { slug: p.slug }, populate: ["category"] });
          if (row && !row.category) {
            await strapi.documents("api::product.product").update({
              documentId: row.documentId,
              data: { category: catId[p.category] },
            });
            strapi.log.info(`seed: linked category for ${p.slug}`);
          }
        }
      }
    } catch (e) {
      strapi.log.error("seed: failed creating store categories/products");
      strapi.log.error(e);
    }

    // 2b-i. The book product, and the link from it to the Upcoming Book single type. Step 2b only
    //       seeds products when the table is EMPTY, so on an already-seeded install the book would
    //       never arrive — this find-or-creates that ONE slug and points the relation at it.
    //       Re-creating on restart is deliberate: the book is hidden with the "Show on shop page"
    //       toggle, not by deleting the product that holds its price.
    try {
      const seedBook = ((seedData as Record<string, any>).products ?? []).find(
        (p: any) => p.slug === "the-untitled-book",
      );
      if (seedBook) {
        let row = await strapi
          .documents("api::product.product")
          .findFirst({ filters: { slug: seedBook.slug } });
        if (!row) {
          const cat = await strapi
            .documents("api::category.category")
            .findFirst({ filters: { slug: seedBook.category } });
          const { category, ...rest } = seedBook; // slug string → relation id below
          row = await strapi.documents("api::product.product").create({
            data: { ...rest, ...(cat ? { category: cat.documentId } : {}) },
          });
          strapi.log.info(`seed: created book product ${seedBook.slug}`);
        }
        const bookUid = "api::upcoming-book.upcoming-book";
        const doc = await strapi.documents(bookUid).findFirst({ populate: ["product"] });
        if (doc && !doc.product) {
          await strapi
            .documents(bookUid)
            .update({ documentId: doc.documentId, data: { product: row.documentId } });
          strapi.log.info("seed: linked book product to upcoming-book");
        }
      }
    } catch (e) {
      strapi.log.error("seed: failed seeding the book product");
      strapi.log.error(e);
    }

    // 2c. Backfill the podcast episode wall with 15 editable slots (Ep 1..15) when none exist, so
    //     editors UPDATE existing rows instead of creating them from scratch. Idempotent: skips once
    //     any episode is present. Empty image/url → the frontend still shows the tone placeholder, so
    //     the look is unchanged until a real thumbnail + link is added.
    // "seed if empty" — deleting ALL episodes and restarting re-adds the 15 placeholders,
    //     same as the rest of the bootstrap. Editors edit rows; they don't clear the whole list.
    try {
      const uid = "api::podcast.podcast";
      const doc = await strapi.documents(uid).findFirst({ populate: ["episodes"] });
      if (doc && (!doc.episodes || doc.episodes.length === 0)) {
        const episodes = Array.from({ length: 15 }, (_, i) => ({ title: `Ep ${i + 1}` }));
        await strapi.documents(uid).update({ documentId: doc.documentId, data: { episodes } });
        strapi.log.info("seed: backfilled 15 podcast episode slots");
      }
    } catch (e) {
      strapi.log.error("seed: failed backfilling podcast episodes");
      strapi.log.error(e);
    }

    // 2d. Footer links backfill. Footer column links + legal moved from `shared.text-item` (label
    //     only) to `shared.link` (label + url); the old link rows don't survive the component-type
    //     change. Re-seed columns + legal from seed-data when they're empty OR still the old shape
    //     (a link lacking a `label` key). Idempotent — skips once migrated.
    try {
      const uid = "api::footer.footer";
      const doc = await strapi
        .documents(uid)
        .findFirst({ populate: { columns: { populate: ["links"] }, legal: true } });
      const seed = (seedData as Record<string, any>).footer ?? {};
      if (doc && seed.columns) {
        const stale = (arr: any[]) => !arr?.length || arr.some((l) => l?.label === undefined);
        const colsBad = !doc.columns?.length || doc.columns.some((c: any) => stale(c.links));
        if (colsBad || stale(doc.legal)) {
          await strapi
            .documents(uid)
            .update({ documentId: doc.documentId, data: { columns: seed.columns, legal: seed.legal } });
          strapi.log.info("seed: backfilled footer links (label+url)");
        }
      }
    } catch (e) {
      strapi.log.error("seed: failed backfilling footer links");
      strapi.log.error(e);
    }

    // 2e. Nav links backfill. `nav.links` moved from `shared.text-item` (label only) to
    //     `shared.link` (label + url); the old rows don't survive the component-type change.
    //     Re-seed from seed-data when links are empty OR still the old shape (missing `label`).
    try {
      const uid = "api::nav.nav";
      const doc = await strapi.documents(uid).findFirst({ populate: ["links"] });
      const seed = (seedData as Record<string, any>).nav ?? {};
      if (doc && seed.links) {
        const stale = (arr: any[]) => !arr?.length || arr.some((l) => l?.label === undefined);
        if (stale(doc.links)) {
          await strapi.documents(uid).update({ documentId: doc.documentId, data: { links: seed.links } });
          strapi.log.info("seed: backfilled nav links (label+url)");
        }
      }
    } catch (e) {
      strapi.log.error("seed: failed backfilling nav links");
      strapi.log.error(e);
    }

    // 2e-i. Hero social URLs. Added to `hero` after this install was seeded, and step 2 only creates
    //       single types that have NO row — so they'd read back null forever. Seed the one URL we
    //       actually know; the rest stay blank, which renders as a greyed-out icon until an editor
    //       pastes a link in.
    try {
      const uid = "api::hero.hero";
      const doc = await strapi.documents(uid).findFirst();
      const seed = (seedData as Record<string, any>).hero ?? {};
      if (doc && !doc.urlYoutube && seed.urlYoutube) {
        await strapi
          .documents(uid)
          .update({ documentId: doc.documentId, data: { urlYoutube: seed.urlYoutube } });
        strapi.log.info("seed: backfilled hero YouTube URL");
      }
    } catch (e) {
      strapi.log.error("seed: failed backfilling hero social URLs");
      strapi.log.error(e);
    }

    // 2f. Preaching-series backfill. Step 2 only seeds a single type that has NO row, and
    //     podcast-page always has one — so seed-data alone never reaches an existing install and
    //     the editor would face an empty repeatable AND seven blank text fields. Unlike 2c-2e this
    //     one fills the sibling scalars too, since they were added in the same never-seeded batch.
    //     No stale-shape probe needed: the old sermon component is gone, so an install carrying the
    //     previous list reads seriesItems back empty and re-seeds on its own.
    try {
      const uid = "api::podcast-page.podcast-page";
      const doc = await strapi.documents(uid).findFirst({ populate: ["seriesItems"] });
      const seed = seedData["podcast-page"] as Record<string, any>;
      if (doc && seed?.seriesItems?.length && !doc.seriesItems?.length) {
        await strapi.documents(uid).update({
          documentId: doc.documentId,
          data: {
            seriesVisible: doc.seriesVisible ?? seed.seriesVisible,
            seriesEyebrow: doc.seriesEyebrow || seed.seriesEyebrow,
            seriesHeadingLead: doc.seriesHeadingLead || seed.seriesHeadingLead,
            seriesHeadingAccent: doc.seriesHeadingAccent || seed.seriesHeadingAccent,
            seriesBody: doc.seriesBody || seed.seriesBody,
            seriesCta: doc.seriesCta || seed.seriesCta,
            seriesCtaUrl: doc.seriesCtaUrl || seed.seriesCtaUrl,
            seriesItems: seed.seriesItems,
          },
        });
        strapi.log.info(`seed: backfilled ${seed.seriesItems.length} preaching series`);
      }
    } catch (e) {
      strapi.log.error("seed: failed backfilling preaching series");
      strapi.log.error(e);
    }

    // 2g. Book Caleb backfill. The form grew a second audience with its own question set, so the
    //     tab labels and all seven dropdowns are new on a single type that already has a row
    //     everywhere — step 2 skips it, and the editor would face empty option lists. Keyed on
    //     corporateEventTypes, which only exists in the new shape.
    try {
      const uid = "api::book-caleb.book-caleb";
      const doc = await strapi.documents(uid).findFirst({ populate: ["corporateEventTypes"] });
      const seed = seedData["book-caleb"] as Record<string, any>;
      if (doc && seed?.corporateEventTypes?.length && !doc.corporateEventTypes?.length) {
        const keep = (field: string) => (doc as Record<string, any>)[field] || seed[field];
        await strapi.documents(uid).update({
          documentId: doc.documentId,
          data: {
            tabChurch: keep("tabChurch"),
            tabCorporate: keep("tabCorporate"),
            formNote: keep("formNote"),
            eventTypeOptions: seed.eventTypeOptions,
            corporateEventTypes: seed.corporateEventTypes,
            attendanceOptions: seed.attendanceOptions,
            industryOptions: seed.industryOptions,
            budgetOptions: seed.budgetOptions,
            heardAboutOptions: seed.heardAboutOptions,
            timelineOptions: seed.timelineOptions,
          },
        });
        strapi.log.info("seed: backfilled the Book Caleb form options");
      }
    } catch (e) {
      strapi.log.error("seed: failed backfilling the Book Caleb form options");
      strapi.log.error(e);
    }

    // 3. Friendly field labels for the admin edit view. These live in the DB (not schema.json):
    //    strapi_core_store_settings, one JSON config row per type. We only override a label that
    //    is still the default (== the field key) so any manual "Configure the view" tweak survives.
    try {
      const table = "strapi_core_store_settings";
      for (const [name, fields] of Object.entries(LABELS)) {
        const key = `plugin_content_manager_configuration_content_types::api::${name}.${name}`;
        const row = await strapi.db.connection(table).where({ key }).first();
        if (!row?.value) continue;
        let cfg: any;
        try {
          cfg = JSON.parse(row.value);
        } catch {
          continue;
        }
        if (!cfg?.metadatas) continue;
        let changed = false;
        for (const [field, meta] of Object.entries(fields)) {
          const edit = cfg.metadatas[field]?.edit;
          if (!edit) continue;
          if (edit.label === field) {
            // still default → safe to override
            if (meta.label) edit.label = meta.label;
            if (meta.description) edit.description = meta.description;
            changed = true;
          }
        }
        if (changed) {
          await strapi.db.connection(table).where({ key }).update({ value: JSON.stringify(cfg) });
          strapi.log.info(`labels: updated ${name}`);
        }
      }
    } catch (e) {
      strapi.log.error("seed: failed applying field labels");
      strapi.log.error(e);
    }
  },
};
