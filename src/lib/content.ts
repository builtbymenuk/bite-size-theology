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
export type Icon = "mic" | "globe" | "award";
export type Status = "sold-out" | "get-tickets";

export interface Nav {
  logo: string;
  links: string[];
  cta: string;
}

export interface Hero {
  tagline: string;
  titleLines: string[];
  subtext: string;
  cta: string;
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
}

export interface Product {
  name: string;
  price: string;
  tag?: string;
  tone: Tone;
  image?: string; // optional CMS media
}

export interface Collection {
  eyebrow: string;
  heading: string;
  link: string;
  products: Product[];
  quote: { text: string; body: string; cta: string };
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
  heroEyebrow: string;
  heroHeading: string;
  heroSubtext: string;
  heroCta: string;
  heroImage?: string;
  proceedsBanner: string;
  bestSellersHeading: string;
  newArrivalsHeading: string;
  founderEyebrow: string;
  founderHeading: string;
  founderBody: string;
  founderCta: string;
  founderImage?: string;
  shippingFee: number; // flat rate added to every order; 0 = free
  currency: string;
}

export interface PodcastAction {
  label: string;
  platform: Platform;
}

export interface Podcast {
  eyebrow: string;
  note: string;
  quote: string;
  badge: { rank: string; category: string };
  titleLines: string[];
  actions: PodcastAction[];
  gallery: Tone[];
}

export interface Stat {
  value: string;
  label: string;
  icon: Icon;
}

export interface PodcastPage {
  hero: { name: string; heading: string; headingAccent: string; subtext: string };
  stats: Stat[];
  cta: { pills: string[]; headingLead: string; headingAccent: string; body: string };
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
  headingLead: string;
  headingScript: string;
  items: FaqItem[];
}

export interface FooterColumn {
  title: string;
  links: string[];
}

export interface Footer {
  columns: FooterColumn[];
  messageLead: string;
  messageWord: string;
  messageBody: string;
  wordmark: string;
  copyright: string;
  legal: string[];
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

export const nav: Nav = {
  logo: "Caleb",
  links: ["Tour", "About", "Shop", "Book Caleb", "Contact", "Podcast"],
  cta: "Donate Now",
};

export const hero: Hero = {
  tagline: "Cultivating faith through truth.",
  titleLines: ["BITE SIZE", "THEOLOGY"],
  subtext:
    "Honest, unfiltered conversations about faith, culture, and the Bible. Welcome to Bite Size Theology.",
  cta: "Discover the Message",
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
};

export const collection: Collection = {
  eyebrow: "Curated Goods",
  heading: "THE COLLECTION",
  link: "Explore all resources",
  products: [
    {
      name: "The Calling: Study Guide",
      price: "$34.00",
      tag: "New Arrival",
      tone: "light" as const,
    },
    {
      name: "Bite Size Theology Vol. 1",
      price: "$16.00",
      tone: "cool" as const,
    },
    {
      name: "Sermon Notes Journal",
      price: "$12.00",
      tone: "yellow" as const,
    },
  ],
  quote: {
    text: "We believe theology isn't just for the scholars—it's for the everyday believer.",
    body: "Every item in our collection is intentionally designed to spark conversations, deepen your faith, and remind you of the profound truths found in scripture throughout your daily life.",
    cta: "Read the Story",
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
  stats: [
    { value: "200+", label: "Episodes Published", icon: "mic" as const },
    { value: "500k", label: "Monthly Listeners", icon: "globe" as const },
    { value: "4.9/5", label: "Average Rating", icon: "award" as const },
  ],
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
};

export const faq: Faq = {
  supportEyebrow: "Support",
  supportHeading: "Didn't find your answer?",
  supportBody:
    "No worries! If you have any other questions or need more information, feel free to reach out directly to contact@calebgriffith.com.",
  supportCta: "Ask me a question",
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
      links: ["Church Online", "Find a Location", "Prayer Request", "Give"],
    },
    {
      title: "Social",
      links: ["Instagram", "YouTube", "Twitter", "Contact"],
    },
  ],
  messageLead: "A message of",
  messageWord: "HOPE.",
  messageBody:
    "Available for speaking engagements, podcasts, and unfiltered conversations about faith.",
  wordmark: "BITE SIZE THEOLOGY",
  copyright: "© 2026 Bite Size Theology. All rights reserved.",
  legal: ["Privacy", "Terms"],
};

export const about: About = {
  eyebrow: "Meet the Founder",
  headingLead: "Meet",
  headingName: "Caleb",
  name: "Caleb Griffith",
  role: "Social Media & Street Evangelist",
  donateCta: "Donate Now",
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
    hero: { tone: "warm" as const, label: "Caleb" },
    turn: { tone: "gold" as const, label: "Sunrise — Arms Open" },
    mission: { tone: "dark" as const, label: "On the Road" },
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
    { name: "Instagram", handle: "@calebgriffith" },
    { name: "YouTube", handle: "bitesizetheology" },
    { name: "Twitter", handle: "@bitesizetheo" },
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

export const tour: Tour = {
  heroImage: "Tour — Concert Crowd",
  secondImage: "The Podcast — Live",
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

// Store fallback — mirrors cms/src/seed-data.json so /store renders even with Strapi down.
export const store: Store = {
  heroEyebrow: "Bite Size Theology / Apparel",
  heroHeading: "Christian Apparel With Purpose",
  heroSubtext:
    "Wearable conversation starters — every piece is a chance to share the hope of Jesus. 10% of proceeds support mission work.",
  heroCta: "Shop the Collection",
  proceedsBanner: "10% of proceeds support mission work",
  bestSellersHeading: "Best Sellers",
  newArrivalsHeading: "New Arrivals",
  founderEyebrow: "Meet the Founder of Bite Size Theology",
  founderHeading: "About Bite Size Theology",
  founderBody:
    "Bryce Crawford is a social media and street evangelist with a deep passion for helping people discover their identity in Jesus Christ. After being saved in a Waffle House, Bryce became filled with the love of Jesus and began sharing the Gospel everywhere he went. He created these shirts as walking conversation starters, hoping to bring Jesus to every corner of the earth and empower lives with compassion and faith.",
  founderCta: "Shop Bite Size Theology",
  shippingFee: 5.99,
  currency: "USD",
};

export const categories: Category[] = [
  { slug: "tees", name: "Tees" },
  { slug: "hoodies", name: "Hoodies" },
  { slug: "sweatshirts", name: "Sweatshirts" },
  { slug: "stickers", name: "Stickers" },
  { slug: "accessories", name: "Accessories" },
];

export const storeProducts: StoreProduct[] = [
  {
    slug: "call-on-jesus-vintage-faded-hoodie",
    title: '"Call on Jesus" Vintage Faded Hooded Sweatshirt',
    description:
      'A soft, vintage-washed hoodie built for everyday wear and everyday witness. The faded "Call on Jesus" graphic invites the question before you say a word.',
    price: 45,
    compareAtPrice: 52,
    images: [],
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
    images: [],
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
    images: [],
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
    images: [],
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
    images: [],
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
    images: [],
    sizes: ["S", "M", "L", "XL", "2XL"],
    category: "tees",
    badge: "New Arrival",
    featured: false,
    soldOut: false,
  },
];
