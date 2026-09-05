// Single source of truth for all page copy/data.
// This is the seam Strapi plugs into later: replace these consts with CMS fetches,
// keep the component props identical.
//
// These consts are now ALSO the static fallback + the TS contract: cms.ts fetches
// Strapi and merges over these shapes, falling back to them whenever Strapi is
// unset / down / malformed. Keep the exported interfaces below in sync with both.

// --- Shared enums (Strapi enumeration fields mirror these) ---
export type Tone = "dark" | "warm" | "light" | "cool" | "gold" | "yellow";
export type Platform = "spotify" | "youtube";
export type Status = "sold-out" | "get-tickets";

export type SocialPlatform =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "facebook"
  | "x"
  | "spotify";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface Nav {
  logo: string;
  links: LinkItem[];
  cta: string;
}

export interface Hero {
  // All six platforms, always, in display order. A blank `url` is meaningful: it renders as a
  // dimmed placeholder icon rather than disappearing, so the set always looks complete.
  socials: SocialLink[];
  tagline: string;
  titleLines: string[];
  subtext: string;
  cta: string;
  ctaUrl: string; // blank = inert button
  bgImage?: string; // optional CMS media; falls back to the tone Placeholder
}

export interface Calling {
  headingScript: string;
  heading: string;
  quote: string;
  introLabel: string;
  body: string[];
  signature: string;
  rooted: { title: string; body: string };
  images?: { bible?: string; scripture?: string }; // CMS polaroid photos; empty → placeholder
}

export interface AllThingsCards {
  testimony: { title: string; cta: string };
  youtube: { body: string };
  tiktok: { body: string; cta: string };
  shop: { title: string };
  give: { title: string; body: string; cta: string };
  chat: { question: string; replies: string[]; close: string };
  podcast: { eyebrow: string; title: string };
  book: { title: string; body: string };
}

export interface AllThings {
  headingLead: string;
  headingScript: string;
  subtext: string;
  cards: AllThingsCards;
  // CMS photos for the bento tiles; each empty → placeholder image.
  images?: {
    testimony?: string; vlog?: string; youtube?: string; tiktok?: string;
    shop?: string; podcast?: string; book?: string;
  };
  // Admin-editable link targets per tile; blank → tile not clickable.
  links: {
    testimony: string; youtube: string; tiktok: string;
    shop: string; podcast: string; book: string; give: string;
  };
}

// Homepage "Upcoming Book" promo. `visible` is the CMS on/off toggle — the section
// is rendered only when true (kept false until the book is published).
export interface UpcomingBook {
  visible: boolean; // → the homepage section
  product?: StoreProduct; // the book's store product: price + Add to cart. Absent → teaser only.
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  releaseLabel: string;
  cta: string;
  ctaUrl: string;
  image?: string; // optional CMS media; falls back to the tone Placeholder
}

export interface Product {
  name: string;
  price: string;
  tag?: string;
  tone: Tone;
  image?: string; // optional CMS media
  url?: string; // optional link target for the card
}

export interface Collection {
  eyebrow: string;
  heading: string;
  link: string;
  linkUrl: string;
  products: Product[];
  quote: { text: string; body: string; cta: string; ctaUrl: string };
}

// --- Store (e-commerce) ---
// Distinct from the homepage `Product` above: this one is a Strapi COLLECTION type with a
// numeric price (money math), a slug (its own /store/[slug] page), and multiple images.
// Managed in the Strapi Category collection (editors add/rename/reorder).
export interface Category {
  slug: string;
  name: string;
}

export interface StoreProduct {
  slug: string;
  title: string;
  description: string;
  price: number; // USD; kept numeric so the server can compute totals in cents
  compareAtPrice?: number; // original price, shown struck-through
  images: string[]; // absolute URLs; empty → tone placeholder
  sizes: string[]; // empty → no size picker (one-size item)
  category?: string; // category slug (→ the Category collection)
  badge?: string; // card pill, e.g. "New Arrival"
  featured: boolean; // → Best Sellers row
  soldOut: boolean; // hides Add-to-cart
}

export interface Store {
  proceedsBanner: string;
  bestSellersHeading: string;
  newArrivalsHeading: string;
  founderEyebrow: string;
  founderHeading: string;
  founderBody: string;
  founderCta: string;
  founderCtaUrl: string;
  founderImage?: string;
  shippingFee: number; // flat rate added to every order; 0 = free
  currency: string;
  // Merch not ready: the homepage collection strip and the /store catalog show a coming-soon
  // panel instead of products, and the product/checkout routes redirect back to /store.
  // Flipped from Strapi (Store — Page), so launching the shop needs no deploy.
  comingSoon: boolean;
  comingSoonMessage: string;
}

export interface PodcastAction {
  label: string;
  platform: Platform;
  url?: string;
}

// One episode tile in the podcast wall. All optional: an empty slot falls back to the `gallery`
// tone placeholder. `title` is alt/aria text only (not shown); `url` makes the tile a link.
export interface Episode {
  image?: string; // absolute CMS media URL
  url?: string; // video link — tile becomes clickable when set
  title?: string;
}

export interface Podcast {
  eyebrow: string;
  note: string;
  quote: string;
  badge: { rank: string; category: string };
  titleLines: string[];
  actions: PodcastAction[];
  gallery: Tone[]; // per-slot empty-state tone (design token)
  episodes: Episode[]; // real thumbnails+links; index i overlays gallery slot i (up to 15)
  youtubeChannelId?: string; // UC… — when set, the wall auto-fills from this channel's latest videos
}

export interface SeriesCard {
  title: string; // series name, set huge across the still
  video: string; // watch/share URL or bare 11-char id; unresolvable = a "more coming" tile
  playlist: string; // playlist URL or bare PL… id, for "Full series →"
  note: string; // small-caps meta line, e.g. "12 parts"
}

export interface PodcastPage {
  hero: { name: string; heading: string; headingAccent: string; subtext: string };
  cta: { pills: string[]; headingLead: string; headingAccent: string; body: string };
  // The church-channel preaching series cards, below the personal-channel wall. Required (not
  // optional) because getPodcastPage returns this whole object verbatim when Strapi is down.
  series: {
    visible: boolean;
    eyebrow: string;
    headingLead: string;
    headingAccent: string;
    body: string;
    cta: string;
    ctaUrl: string;
    items: SeriesCard[]; // the cards; empty = section hidden
  };
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Faq {
  supportEyebrow: string;
  supportHeading: string;
  supportBody: string;
  supportCta: string;
  supportCtaUrl: string;
  headingLead: string;
  headingScript: string;
  items: FaqItem[];
}

export interface LinkItem {
  label: string;
  url: string; // full https:// (external, opens new tab) or /path (internal); "" = disabled
}

export interface FooterColumn {
  title: string;
  links: LinkItem[];
}

export interface Footer {
  columns: FooterColumn[];
  messageLead: string;
  messageWord: string;
  messageBody: string;
  wordmark: string;
  copyright: string;
  legal: LinkItem[];
}

export interface AboutImage {
  tone: Tone;
  label: string;
  src?: string; // optional CMS media
}

export interface About {
  eyebrow: string;
  headingLead: string;
  headingName: string;
  name: string;
  role: string;
  donateCta: string;
  donateCtaUrl: string;
  intro: string;
  turnLead: string;
  story: string[];
  missionLabel: string;
  quote: { text: string; attribution: string };
  images: { hero: AboutImage; turn: AboutImage; mission: AboutImage };
}

export interface Social {
  name: string;
  handle: string;
  url?: string;
}

export interface Contact {
  headingLead: string;
  headingScript: string;
  intro: string;
  email: { label: string; address: string; note: string };
  mailing: { label: string; lines: string[] };
  connectLabel: string;
  socials: Social[];
  form: {
    heading: string;
    subheading: string;
    fields: { name: string; email: string; subject: string; message: string };
    subjectOptions: string[];
    submit: string;
    success: string;
  };
}

export interface BookCaleb {
  headingLead: string;
  headingScript: string;
  intro: string;
  responseNote: string;
  directEmail: { label: string; address: string };
  form: {
    heading: string;
    subheading: string;
    tabChurch: string;
    tabCorporate: string;
    submit: string;
    note: string;
    success: string;
    // Admin-tunable dropdown contents. The field labels themselves live in BookCalebForm —
    // they're structure, not copy.
    eventTypeOptions: string[]; // church tab
    corporateEventTypes: string[];
    attendanceOptions: string[]; // shared by every "how many people" select
    industryOptions: string[];
    budgetOptions: string[];
    heardAboutOptions: string[];
    timelineOptions: string[];
  };
}

export interface Prayer {
  headingLead: string;
  headingScript: string;
  intro: string;
  privacyNote: string;
  assurance: { heading: string; body: string };
  form: {
    heading: string;
    subheading: string;
    fields: { name: string; email: string; request: string };
    urgentLabel: string;
    submit: string;
  };
}

// Admin-editable theme colors (roles → the Tailwind @theme tokens they override at runtime).
export interface ThemeColors {
  paper: string; // --color-cream (page background)
  ink: string; // --color-ink (text / darkest fills)
  accent: string; // --color-gold (accent: script words, badges, hovers)
  darkSection: string; // --color-charcoal (hero/footer/dark sections)
  blue: string; // --color-blue (links, CTA)
}

export interface Donate {
  heroEyebrow: string;
  heroHeading: string;
  heroAccent: string; // last word, plum italic
  heroSubtext: string;
  heroImage?: string;
  presets: string[]; // dollar amounts as strings, e.g. "50"
  fundOptions: string[];
  impactHeading: string;
  impactStats: { value: string; label: string; icon: "mic" | "globe" | "award" }[];
  proceedsNote: string; // marquee strip
  assuranceTitle: string;
  assuranceBody: string;
  thankYouHeading: string;
  thankYouBody: string;
}

export interface TourDate {
  city: string;
  venue: string;
  date: string;
  status: Status;
  url: string;
}

export interface Region {
  id: string;
  eyebrow: string;
  heading?: string;
  code?: string;
  dates: TourDate[];
}

export interface Tour {
  heroImage: string;
  secondImage: string;
  heroImageSrc?: string; // optional CMS media
  secondImageSrc?: string; // optional CMS media
  regions: Region[];
}

export interface PostCategory {
  slug: string;
  name: string;
}

export interface Post {
  slug: string;
  title: string;
  /** e.g. "Romans 8:1-11" — shown in gold above the title. Optional. */
  scripture?: string;
  excerpt?: string;
  cover?: string;
  /** Strapi `blocks` AST. Untyped on purpose: Blocks.tsx narrows node by node. */
  body: unknown[];
  category?: PostCategory;
  author: string;
  /** ISO date from Strapi's publishedAt; formatted at render time. */
  date: string;
  featured: boolean;
  /** Derived from `body`, not stored — see readMinutes() in cms.ts. */
  readMinutes: number;
}

export interface Blog {
  eyebrow: string;
  headingLead: string;
  headingScript: string;
  intro: string;
  allLabel: string;
  emptyMessage: string;
  keepReadingHeading: string;
}

export const nav: Nav = {
  logo: "Caleb",
  links: [
    { label: "About", url: "/about" },
    { label: "Sermons/Videos", url: "/podcast" },
    { label: "Blog", url: "/blog" },
    { label: "Shop", url: "/store" },
    { label: "Book Caleb", url: "/book-caleb" },
    { label: "Contact", url: "/contact" },
  ],
  cta: "Donate Now",
};

export const hero: Hero = {
  // Strapi unreachable → the same six icons, all inert. Keeps the row's shape identical to the
  // live version instead of collapsing the layout.
  socials: [
    { platform: "instagram", url: "" },
    { platform: "youtube", url: "" },
    { platform: "tiktok", url: "" },
    { platform: "facebook", url: "" },
    { platform: "x", url: "" },
    { platform: "spotify", url: "" },
  ],
  tagline: "Cultivating faith through truth.",
  titleLines: ["BITE SIZE", "THEOLOGY"],
  subtext:
    "Honest, unfiltered conversations about faith, culture, and the Bible. Welcome to Bite Size Theology.",
  cta: "Discover the Message",
  ctaUrl: "",
  bgImage: "/hero-caleb.png", // pastor crop (wordmark removed); CMS Hero → bgImage overrides
};

export const eyebrow: string = "Bite Size Theology / Explore the Word";

export const calling: Calling = {
  headingScript: "The",
  heading: "CALLING",
  quote:
    "We are not called to be comfortable. We are called to be courageous.",
  introLabel: "Hi, I'm Caleb Griffith",
  body: [
    "I am a pastor, teacher, and author dedicated to breaking down complex theological concepts for the modern believer.",
    "From my time ministering in New Zealand to returning to my roots in Statesville, I bring a global perspective and a local heart to teaching the Word as the Lead Pastor at Cornerstone Church in Statesville, NC.",
  ],
  signature: "Caleb Griffith",
  rooted: {
    title: "Rooted in NC",
    body: "Building spaces where every heart is seen, heard, and deeply valued.",
  },
  // Themed default artwork; a CMS upload (imgBible/imgScripture) overrides each.
  images: {
    bible: "/placeholders/calling-bible.jpg",
    scripture: "/placeholders/calling-scripture.jpg",
  },
};

export const allThings: AllThings = {
  headingLead: "ALL THE",
  headingScript: "things",
  subtext:
    "Connect with us and stay updated on our journey! Find out about new events, interviews, merch drops, and more.",
  cards: {
    testimony: { title: "Caleb's Testimony", cta: "Watch the Vlog" },
    youtube: {
      body: "Watch interviews, clips, and powerful stories about the love of Jesus Christ on our YouTube channel.",
    },
    tiktok: {
      body: "Watch the George Janko interview on YouTube",
      cta: "Connect on TikTok",
    },
    shop: { title: "Shop" },
    give: {
      title: "Give Now",
      body: "Your generosity helps make an eternal impact.",
      cta: "Click here",
    },
    chat: {
      question: "How do I get involved with your ministry?",
      replies: [
        "There are two main ways you can help!",
        "First, you can partner with us in prayer!",
        "Secondly, you can donate directly to our ministry. God has done SO much!",
      ],
      close: "Thanks! Excited to be a part of this!",
    },
    podcast: { eyebrow: "By Podcast", title: "Bite Size Theology" },
    book: {
      title: "Book Caleb",
      body: "Looking to have Caleb speak at your next event?",
    },
  },
  // Themed default artwork; each CMS media field (imgTestimony, …) overrides its slot.
  images: {
    testimony: "/placeholders/at-testimony.jpg",
    vlog: "/placeholders/at-vlog.jpg",
    youtube: "/placeholders/at-youtube.jpg",
    tiktok: "/placeholders/at-tiktok.jpg",
    shop: "/placeholders/at-shop.jpg",
    podcast: "/placeholders/at-podcast.jpg",
    book: "/placeholders/at-book.jpg",
  },
  // Per-tile link targets (admin-editable). Social ones blank until the client supplies them.
  links: {
    testimony: "",
    youtube: "https://www.youtube.com/channel/UC7VL8Ljt2f0luWz4HMkUGuw",
    tiktok: "",
    shop: "/store",
    podcast: "/podcast",
    book: "/book-caleb",
    give: "/donate",
  },
};

// visible:false → hidden until the pastor's book launches. Flip in Strapi (or here) to publish.
export const upcomingBook: UpcomingBook = {
  visible: false,
  eyebrow: "Coming Soon",
  title: "The Untitled Book",
  subtitle: "A new work from Pastor Caleb Griffith",
  body: "The teaching behind Bite Size Theology, gathered into one place — deep truths of the faith, written to be read in the margins of an ordinary day.",
  releaseLabel: "Coming Fall 2026",
  cta: "Notify Me",
  ctaUrl: "",
  image: "/placeholders/book-cover.jpg",
};

export const collection: Collection = {
  eyebrow: "Curated Goods",
  heading: "THE COLLECTION",
  link: "Explore all resources",
  linkUrl: "/store",
  products: [
    {
      name: "The Calling: Study Guide",
      price: "$34.00",
      tag: "New Arrival",
      tone: "light" as const,
      image: "/placeholders/col-tote.jpg",
    },
    {
      name: "Bite Size Theology Vol. 1",
      price: "$16.00",
      tone: "cool" as const,
      image: "/placeholders/col-book.jpg",
    },
    {
      name: "Sermon Notes Journal",
      price: "$12.00",
      tone: "yellow" as const,
      image: "/placeholders/col-journal.jpg",
    },
  ],
  quote: {
    text: "We believe theology isn't just for the scholars—it's for the everyday believer.",
    body: "Every item in our collection is intentionally designed to spark conversations, deepen your faith, and remind you of the profound truths found in scripture throughout your daily life.",
    cta: "Read the Story",
    ctaUrl: "/about",
  },
};

export const podcast: Podcast = {
  eyebrow: "The Bite Size Theology Podcast",
  note: "Hey you! Yes, you, beautiful you :)",
  quote:
    "Refresh your soul with Caleb Griffith's theology podcast, where he dives into Christ-centered discussions on faith, world events, and key issues impacting Christianity today.",
  badge: { rank: "#1 Podcast", category: "Religion" },
  titleLines: ["Bite Size Theology", "Podcast"],
  actions: [
    { label: "Listen", platform: "spotify" as const },
    { label: "Watch", platform: "youtube" as const },
  ],
  // Wall of episode thumbnails (placeholder tones) — bleeds off the right, fades at the bottom.
  gallery: [
    "cool", "warm", "dark",
    "cool", "dark", "warm", "cool", "gold", "dark",
    "dark", "cool", "warm", "cool", "dark", "warm",
  ] as const,
  episodes: [], // filled from Strapi; empty → every slot shows its gallery tone
  // The client's channel — the wall auto-fills from its latest videos even if Strapi is down.
  youtubeChannelId: "UC7VL8Ljt2f0luWz4HMkUGuw",
};

// /podcast page. Hero buttons reuse podcast.actions (above) — not duplicated here.
export const podcastPage: PodcastPage = {
  hero: {
    name: "Caleb Griffith",
    heading: "Deep faith.",
    headingAccent: "Bite-sized.",
    subtext:
      "Join Pastor Caleb Griffith as he unpacks profound theological truths into accessible, everyday wisdom. New episodes every Wednesday.",
  },
  cta: {
    pills: [
      "Deep Faith",
      "New Episodes",
      "Pastor Caleb",
      "Theological Truths",
      "Bite Size Theology",
      "Watch on YouTube",
    ],
    headingLead: "Ready to deepen your",
    headingAccent: "understanding?",
    body:
      "Subscribe to our YouTube channel and never miss a new episode of Bite Size Theology.",
  },
  // Caleb's preaching series on Cornerstone Church Statesville's channel, promoted below the
  // personal-channel wall. Editable in Strapi (Page — Podcast → "Series — Cards"); a card with a
  // blank video renders as a "Coming soon" placeholder, and unchecking "Show this section" or
  // emptying the list hides the whole thing.
  series: {
    visible: true,
    eyebrow: "Preaching Series",
    headingLead: "Watch a whole series",
    headingAccent: "start to finish.",
    body:
      "Pastor Caleb's sermon series from the pulpit at Cornerstone — pick one and watch the whole run in order.",
    cta: "All sermons on YouTube",
    ctaUrl: "https://www.youtube.com/@cornerstonestatesville/playlists",
    items: [
      {
        title: "Sow Seed, Bear Fruit",
        video: "https://www.youtube.com/watch?v=4JOnaInwGa0",
        playlist:
          "https://www.youtube.com/playlist?list=PLTKxXrMpXbkKZLlt445yVI0vhjdshuCOw",
        note: "12 parts",
      },
      {
        title: "Plot Twists and Prophets",
        video: "https://www.youtube.com/watch?v=ln5ZDu5sUsY",
        playlist:
          "https://www.youtube.com/playlist?list=PLTKxXrMpXbkIrHhYjgvtG2pQxvKJTncrP",
        note: "5 parts",
      },
      {
        title: "Subject to Change",
        video: "https://www.youtube.com/watch?v=hcWQNlqFrBE",
        playlist:
          "https://www.youtube.com/playlist?list=PLTKxXrMpXbkKuQwHxqDECQdDRwNC65v5C",
        note: "5 parts",
      },
      {
        title: "Pursuing the Presence of God",
        video: "https://www.youtube.com/watch?v=tSCBSUm8BYE",
        playlist:
          "https://www.youtube.com/playlist?list=PLTKxXrMpXbkK_5eoFoavaJ90rPYNQJ2nK",
        note: "8 parts",
      },
      {
        title: "Story of God",
        video: "https://www.youtube.com/watch?v=fYynW17VERA",
        playlist:
          "https://www.youtube.com/playlist?list=PLTKxXrMpXbkL-8hQ43cLm-YgPBtBfYKZG",
        note: "42 parts",
      },
      {
        title: "Like No Other",
        video: "https://www.youtube.com/watch?v=SbHCCM69tOg",
        playlist:
          "https://www.youtube.com/playlist?list=PLTKxXrMpXbkLmoETUh6e3sCwMM0WVngtj",
        note: "8 parts",
      },
      {
        title: "7 Churches of Revelation",
        video: "https://www.youtube.com/watch?v=XvDHjOFMzZg",
        playlist:
          "https://www.youtube.com/playlist?list=PLTKxXrMpXbkIXMlFHduKrucXAdBaD4h5l",
        note: "7 parts",
      },
      {
        title: "All Roads Lead to Romans",
        video: "https://www.youtube.com/watch?v=0H9xUKtLHVg",
        playlist:
          "https://www.youtube.com/playlist?list=PLTKxXrMpXbkJORrGp-YtyBcZ8wwmLR4GH",
        note: "7 parts",
      },
      {
        title: "Jonah",
        video: "https://www.youtube.com/watch?v=SSz2G3y2ye0",
        playlist:
          "https://www.youtube.com/playlist?list=PLTKxXrMpXbkJa0cy1gH0JRtkCQAyCuhqb",
        note: "6 parts",
      },
      // Add a row here (and in Strapi) as each new series lands. A row with a blank `video`
      // renders as a "Coming soon" frame, which is how a slot gets reserved before it is filmed.
    ],
  },
};

export const faq: Faq = {
  supportEyebrow: "Support",
  supportHeading: "Didn't find your answer?",
  supportBody:
    "No worries! If you have any other questions or need more information, feel free to reach out directly to contact@calebgriffith.com.",
  supportCta: "Ask me a question",
  supportCtaUrl: "/contact",
  headingLead: "FREQUENT",
  headingScript: "asks",
  items: [
    {
      q: "I want Caleb to speak at my event. Who do I contact?",
      a: "Head to the Book Caleb page and send us the details of your event. Our team reviews every request and will get back to you within a few business days.",
    },
    {
      q: "I ordered merch and have an inquiry. Who do I talk to?",
      a: "Email contact@calebgriffith.com with your order number and we'll sort it out right away.",
    },
    {
      q: "How do I support what you guys are doing?",
      a: "Prayer, sharing our content, and giving all make a real difference. Every bit helps us reach more people with the message.",
    },
    {
      q: "I don't have extra funds to donate. How else can I help?",
      a: "Share our videos, invite a friend to listen, and keep us in your prayers. Generosity isn't only financial.",
    },
    {
      q: "Does Jesus love me?",
      a: "Yes. Unconditionally, completely, and right now — exactly as you are.",
    },
  ],
};

export const footer: Footer = {
  columns: [
    {
      title: "Connect",
      links: [
        { label: "Church Online", url: "" },
        { label: "Find a Location", url: "" },
        { label: "Prayer Request", url: "/prayer" },
        { label: "Give", url: "/donate" },
      ],
    },
    {
      title: "Social",
      links: [
        { label: "Instagram", url: "" },
        { label: "YouTube", url: "" },
        { label: "Facebook", url: "" },
        { label: "Contact", url: "/contact" },
      ],
    },
  ],
  messageLead: "A message of",
  messageWord: "HOPE.",
  messageBody:
    "Available for speaking engagements, podcasts, and unfiltered conversations about faith.",
  wordmark: "BITE SIZE THEOLOGY",
  copyright: "© 2026 Bite Size Theology. All rights reserved.",
  legal: [
    { label: "Privacy", url: "" },
    { label: "Terms", url: "" },
  ],
};

export const about: About = {
  eyebrow: "Meet the Founder",
  headingLead: "Meet",
  headingName: "Caleb",
  name: "Caleb Griffith",
  role: "Pastor and International Evangelist",
  donateCta: "Donate Now",
  donateCtaUrl: "/donate",
  intro:
    "Raised in church, Caleb carried a deep faith but wrestled with depression and anxiety for years.",
  turnLead: "But, God!",
  story: [
    "One night, at his breaking point, Caleb made a plan to end his life. But in that moment, instead of darkness, he encountered Jesus in a life-altering way. Rather than giving up, he gave his life to the One who had been reaching out all along.",
    "Since that night, Caleb has dedicated his life to sharing the gospel with millions—both online and in person. His mission is simple: to bring the hope he found to others, sharing the light and love of Jesus wherever he goes. Caleb's journey is a testament to the power of faith, the resilience of hope, and the boundless love of God.",
  ],
  missionLabel: "The Mission",
  quote: {
    text: "It wasn't until I reached the end of my own strength that I discovered grace had been holding me the entire time.",
    attribution: "The Turning Point",
  },
  images: {
    hero: { tone: "warm" as const, label: "Caleb", src: "/placeholders/about-hero.jpg" },
    turn: { tone: "gold" as const, label: "Sunrise — Arms Open", src: "/placeholders/about-turn.jpg" },
    mission: { tone: "dark" as const, label: "On the Road", src: "/placeholders/about-mission.jpg" },
  },
};

export const contact: Contact = {
  headingLead: "Let's get",
  headingScript: "acquainted.",
  intro:
    "Whether you have a question about the ministry, a speaking request, or simply want to share a prayer need—we would love to hear from you.",
  email: {
    label: "Direct Email",
    address: "hello@bitesizetheology.com",
    note: "Typical response: 24-48 hours",
  },
  mailing: {
    label: "Mailing Address",
    lines: ["Bite Size Theology", "PO Box 12345", "Nashville, TN 37203"],
  },
  connectLabel: "Connect",
  socials: [
    { name: "Instagram", handle: "@pastorcalebgriffith", url: "" },
    { name: "YouTube", handle: "bitesizetheology", url: "" },
    { name: "Facebook", handle: "@pastorcalebgriffith", url: "" },
  ],
  form: {
    heading: "Send a Message",
    subheading: "We'll get back to you shortly",
    fields: {
      name: "Full Name",
      email: "Email Address",
      subject: "Subject",
      message: "Message",
    },
    subjectOptions: [
      "General Inquiry",
      "Speaking Request",
      "Prayer Need",
      "Media / Podcast",
      "Other",
    ],
    submit: "Submit Inquiry",
    success: "Thank you — your message is on its way. We'll be in touch soon.",
  },
};

export const bookCaleb: BookCaleb = {
  headingLead: "Have Caleb",
  headingScript: "speak.",
  intro: "Conferences, Sunday services, retreats, youth events—wherever people are hungry for the Word, Caleb would be honored to come. Send us the details of your event and our team will follow up.",
  responseNote: "We review every request and respond within a few business days.",
  directEmail: {
    label: "Prefer email?",
    address: "hello@bitesizetheology.com",
  },
  form: {
    heading: "Request a Booking",
    subheading: "Tell us about your event",
    tabChurch: "Church / Ministry",
    tabCorporate: "Corporate / Organization",
    submit: "Send Request",
    note: "* Required fields. Our team will respond within a few business days.",
    success: "Thank you — your booking request is on its way. Our team will be in touch soon.",
    eventTypeOptions: [
      "Sunday service",
      "Conference",
      "Revival / special series",
      "Men's event",
      "Women's event",
      "Youth event",
      "Retreat",
      "Leadership weekend",
      "Other",
    ],
    corporateEventTypes: [
      "Leadership summit",
      "Staff retreat",
      "Corporate kickoff",
      "Campus / student program",
      "Executive gathering",
      "Panel or fireside chat",
      "Other",
    ],
    attendanceOptions: [
      "Under 100",
      "100–250",
      "250–500",
      "500–1,000",
      "1,000–2,500",
      "2,500+",
    ],
    industryOptions: [
      "Nonprofit",
      "Education",
      "Healthcare",
      "Technology",
      "Finance",
      "Sports / athletics",
      "Government",
      "Other",
    ],
    budgetOptions: [
      "Prefer not to say",
      "Under $2,500",
      "$2,500–$5,000",
      "$5,000–$10,000",
      "$10,000+",
      "Let's discuss",
    ],
    heardAboutOptions: [
      "YouTube",
      "The podcast",
      "A friend or colleague",
      "Heard Caleb speak",
      "Social media",
      "Search",
      "Other",
    ],
    timelineOptions: [
      "Decided — ready to book",
      "Within 2 weeks",
      "Within a month",
      "Still exploring",
    ],
  },
};

export const prayer: Prayer = {
  headingLead: "How can we",
  headingScript: "pray?",
  intro:
    "Whatever you're carrying—a burden, a hope, a hurt—you don't have to carry it alone. Share it below and our prayer team will lift it up.",
  privacyNote: "This stays between you and our prayer team. Share only what you're comfortable with.",
  assurance: {
    heading: "We're praying with you.",
    body: "“Cast all your anxiety on him because he cares for you.” — 1 Peter 5:7\n\nYour request has reached our prayer team. May you know His peace today.",
  },
  form: {
    heading: "Share a Prayer Request",
    subheading: "We'll be praying",
    fields: {
      name: "Your Name (optional)",
      email: "Email (optional)",
      request: "What can we pray for?",
    },
    urgentLabel: "This is urgent",
    submit: "Send Prayer Request",
  },
};

export const themeColors: ThemeColors = {
  paper: "#edf1f7",
  ink: "#0e2038",
  accent: "#b8945f",
  darkSection: "#16294c",
  blue: "#2563ad",
};

export const donate: Donate = {
  heroEyebrow: "Partner with the mission",
  heroHeading: "Help take the gospel to the",
  heroAccent: "streets.",
  heroSubtext:
    "Your gift fuels honest, unfiltered conversations about faith — reaching people where they are, on the streets, online, and around the world. Every dollar goes further than you know.",
  presets: ["25", "50", "100", "250"],
  fundOptions: ["Where needed most", "Missions & Outreach", "Media & Content"],
  impactHeading: "Your generosity at work",
  impactStats: [
    { value: "10M+", label: "Views a month", icon: "globe" },
    { value: "40+", label: "Nations reached", icon: "award" },
    { value: "100%", label: "Toward the mission", icon: "mic" },
  ],
  proceedsNote: "Every gift supports street evangelism, media, and outreach",
  assuranceTitle: "Give with confidence",
  assuranceBody:
    "Payments are processed securely through Stripe and PayPal — we never see or store your card details. You'll receive an emailed receipt for every gift.",
  thankYouHeading: "Thank you for your generosity.",
  thankYouBody:
    "“Each of you should give what you have decided in your heart to give… for God loves a cheerful giver.” — 2 Corinthians 9:7\n\nYour gift is already at work. A receipt is on its way to your inbox.",
};

export const tour: Tour = {
  heroImage: "Tour — Concert Crowd",
  secondImage: "The Podcast — Live",
  heroImageSrc: "/placeholders/tour-crowd.jpg",
  secondImageSrc: "/placeholders/tour-live.jpg",
  regions: [
    {
      id: "us",
      eyebrow: "Tour Dates",
      dates: [
        { city: "Phoenix, AZ", venue: "Footprint Center", date: "Feb 22 2026", status: "sold-out" as const, url: "#" },
        { city: "Dallas, TX", venue: "House of Blues", date: "Feb 27 2026", status: "sold-out" as const, url: "#" },
        { city: "Houston, TX", venue: "Bayou Music Center", date: "Feb 28 2026", status: "sold-out" as const, url: "#" },
        { city: "Dallas, TX", venue: "House of Blues", date: "Mar 01 2026", status: "sold-out" as const, url: "#" },
        { city: "Oklahoma City, OK", venue: "Civic Center", date: "Mar 03 2026", status: "sold-out" as const, url: "#" },
        { city: "Huntsville, AL", venue: "Von Braun Center", date: "Mar 04 2026", status: "sold-out" as const, url: "#" },
        { city: "New York, NY", venue: "The Town Hall", date: "Mar 16 2026", status: "get-tickets" as const, url: "#" },
        { city: "Munhall, PA", venue: "Carnegie Music Hall", date: "Mar 17 2026", status: "sold-out" as const, url: "#" },
        { city: "Salt Lake City, UT", venue: "The Complex", date: "Mar 25 2026", status: "get-tickets" as const, url: "#" },
        { city: "Los Angeles, CA", venue: "Shrine Auditorium", date: "Mar 29 2026", status: "sold-out" as const, url: "#" },
      ],
    },
    {
      id: "anz",
      eyebrow: "Tour Dates",
      heading: "AUSTRALIA & NEW ZEALAND",
      code: "ANZ",
      dates: [
        { city: "Melbourne", venue: "Palais Theatre", date: "07 FEB", status: "get-tickets" as const, url: "#" },
        { city: "Brisbane", venue: "Fortitude Music Hall", date: "10 FEB", status: "sold-out" as const, url: "#" },
        { city: "Sydney", venue: "Enmore Theatre", date: "11 FEB", status: "sold-out" as const, url: "#" },
        { city: "Sydney", venue: "Enmore Theatre", date: "12 FEB", status: "sold-out" as const, url: "#" },
        { city: "Auckland", venue: "Convention Centre", date: "14 FEB", status: "get-tickets" as const, url: "#" },
      ],
    },
  ],
};

// Blog page copy — mirrors cms/src/seed-data.json. There is deliberately no fallback POST list:
// an empty blog is a legitimate state, and inventing sample articles would leave the client
// deleting placeholder content the way the seeded sample products did.
export const blog: Blog = {
  eyebrow: "Bite Size Theology / Writing",
  headingLead: "Notes from",
  headingScript: "the Margin",
  intro:
    "Short readings and longer studies — the notes I keep in the margins of my Bible, written out.",
  allLabel: "All",
  emptyMessage: "The first piece is still being written. Check back soon.",
  keepReadingHeading: "Keep Reading",
};

// Store fallback — mirrors cms/src/seed-data.json so /store renders even with Strapi down.
export const store: Store = {
  founderImage: "/placeholders/store-founder.jpg",
  proceedsBanner: "10% of proceeds support mission work",
  bestSellersHeading: "Best Sellers",
  newArrivalsHeading: "New Arrivals",
  founderEyebrow: "Meet the Founder of Bite Size Theology",
  founderHeading: "About Bite Size Theology",
  founderBody:
    "Bryce Crawford is a social media and street evangelist with a deep passion for helping people discover their identity in Jesus Christ. After being saved in a Waffle House, Bryce became filled with the love of Jesus and began sharing the Gospel everywhere he went. He created these shirts as walking conversation starters, hoping to bring Jesus to every corner of the earth and empower lives with compassion and faith.",
  founderCta: "Shop Bite Size Theology",
  founderCtaUrl: "#catalog",
  shippingFee: 5.99,
  currency: "USD",
  comingSoon: true,
  comingSoonMessage:
    "The shop is being stocked right now. Follow along on the podcast and socials — we'll say the word the moment it opens.",
};

export const categories: Category[] = [
  { slug: "tees", name: "Tees" },
  { slug: "hoodies", name: "Hoodies" },
  { slug: "sweatshirts", name: "Sweatshirts" },
  { slug: "stickers", name: "Stickers" },
  { slug: "accessories", name: "Accessories" },
];

export const storeProducts: StoreProduct[] = [
  // The book. Its Strapi product has no uploaded media yet, so this entry is what gives it a cover
  // in the rows, the catalog, the product page and the cart — mapProduct falls back to this list by
  // slug. Same file the /store hero and the homepage section show, so all four agree.
  {
    slug: "the-untitled-book",
    title: "The Untitled Book",
    description:
      "A new work from Pastor Caleb Griffith. Placeholder copy — replace the title, description, price and cover in the CMS before launch.",
    price: 24,
    images: ["/placeholders/book-cover.jpg"],
    sizes: [],
    category: "books",
    badge: "Coming Soon",
    featured: false,
    soldOut: true,
  },
  {
    slug: "call-on-jesus-vintage-faded-hoodie",
    title: '"Call on Jesus" Vintage Faded Hooded Sweatshirt',
    description:
      'A soft, vintage-washed hoodie built for everyday wear and everyday witness. The faded "Call on Jesus" graphic invites the question before you say a word.',
    price: 45,
    compareAtPrice: 52,
    images: ["/placeholders/products/call-on-jesus-vintage-faded-hoodie.jpg"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    category: "hoodies",
    badge: "Best Seller",
    featured: true,
    soldOut: false,
  },
  {
    slug: "call-on-jesus-vintage-faded-tee",
    title: '"Call on Jesus" Vintage Faded T-Shirt',
    description:
      "The classic \"Call on Jesus\" tee in a lightweight, vintage-faded finish. A wearable reminder — and a conversation starter — for wherever the day takes you.",
    price: 30,
    compareAtPrice: 42,
    images: ["/placeholders/products/call-on-jesus-vintage-faded-tee.jpg"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    category: "tees",
    badge: "Best Seller",
    featured: true,
    soldOut: false,
  },
  {
    slug: "check-the-back-for-good-news-shirt",
    title: '"Check the Back for Good News" Shirt',
    description:
      "Front says check the back — the back carries the Gospel. A playful, curiosity-sparking tee that opens doors to the best news there is.",
    price: 30,
    compareAtPrice: 42,
    images: ["/placeholders/products/check-the-back-for-good-news-shirt.jpg"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    category: "tees",
    badge: "Best Seller",
    featured: true,
    soldOut: false,
  },
  {
    slug: "crack-this-not-drugs-bible-crewneck",
    title: '"Crack This! Not Drugs" Bible Crewneck',
    description:
      "A cozy fleece crewneck with a bold, redemptive message. Crack open the Word, not a bottle — hope over escape.",
    price: 38,
    compareAtPrice: 47,
    images: ["/placeholders/products/crack-this-not-drugs-bible-crewneck.jpg"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    category: "sweatshirts",
    badge: "Best Seller",
    featured: true,
    soldOut: false,
  },
  {
    slug: "honk-if-you-love-jesus-bumper-sticker",
    title: '"Honk if You Love Jesus" Bumper Sticker',
    description:
      "Durable, weatherproof vinyl for the back of any ride. Spread a little joy at every stoplight.",
    price: 7,
    images: ["/placeholders/products/honk-if-you-love-jesus-bumper-sticker.jpg"],
    sizes: [],
    category: "stickers",
    badge: "New Arrival",
    featured: false,
    soldOut: false,
  },
  {
    slug: "i-love-jesus-cartoon-shirt",
    title: '"I Love Jesus" Cartoon Shirt',
    description:
      "A bright, friendly cartoon design that wears your faith with a smile. Soft cotton, everyday fit.",
    price: 30,
    compareAtPrice: 42,
    images: ["/placeholders/products/i-love-jesus-cartoon-shirt.jpg"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    category: "tees",
    badge: "New Arrival",
    featured: false,
    soldOut: false,
  },
];
