import seedData from "./seed-data.json";

// The 13 single types (singularName == the api uid segment == the path cms.ts fetches).
const NAMES = [
  "nav", "hero", "eyebrow", "calling", "all-thing", "collection", "podcast",
  "podcast-page", "faq", "footer", "about", "contact", "tour",
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
  },
  calling: {
    headingScript: { label: "Heading — script word", description: 'The italic gold word (e.g. "The")' },
    heading: { label: "Heading — main word" },
    introLabel: { label: "Intro label", description: 'e.g. "Hi, I\'m Caleb Griffith"' },
    body: { label: "Body paragraphs" },
    rootedTitle: { label: "Rooted card — Title" },
    rootedBody: { label: "Rooted card — Body" },
  },
  "all-thing": {
    headingLead: { label: "Heading — lead" },
    headingScript: { label: "Heading — script word (italic)" },
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
  tour: {
    regions: { label: "Tour regions", description: "Each region has an optional heading + code, and a list of dates" },
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
        for (const name of NAMES) {
          const action = `api::${name}.${name}.find`;
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
    // ponytail: one-shot seed guarded by findFirst — leave it, it no-ops after the first run.
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
