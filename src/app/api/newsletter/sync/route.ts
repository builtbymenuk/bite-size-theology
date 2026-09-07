import { NextResponse } from "next/server";
import { addContact, audienceConfigured, unsubscribeContact } from "@/lib/newsletter-audience";
import { configured, listSubscribers } from "@/lib/newsletter-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Push every Strapi subscriber into Resend's contact list. Two jobs:
//   1. Backfill — anyone who confirmed before this sync existed.
//   2. Repair — the per-confirm sync is best effort, so a Resend outage leaves someone missing
//      from the sending list while their Strapi row looks perfectly fine. This is how that's found
//      and fixed, rather than discovering it when a newsletter skips them.
//
// Idempotent: re-running only re-asserts the same state. Same secret gate as /api/revalidate.
//
// ponytail: sequential with a small gap, capped per run — Resend rate-limits the contacts API and
// this is an admin-triggered one-off, not a request-path concern. If the list ever outgrows one
// run, the response says so and you run it again; move to a queue only if that gets tedious.
const PAGE = 100;
const MAX_PER_RUN = 500;
const GAP_MS = 120;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "invalid secret" }, { status: 401 });
  }
  if (!configured() || !audienceConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Strapi or Resend is not configured." },
      { status: 503 },
    );
  }

  let added = 0;
  let unsubscribed = 0;
  let failed = 0;
  let seen = 0;
  let more = false;

  try {
    for (let page = 1; ; page++) {
      const rows = await listSubscribers(page, PAGE);
      if (!rows.length) break;

      for (const r of rows) {
        // `pending` is deliberately skipped: an unconfirmed address has not opted in, and putting
        // it on the sending list is exactly what double opt-in exists to prevent.
        if (r.status === "pending") continue;
        if (seen >= MAX_PER_RUN) {
          more = true;
          break;
        }
        seen++;
        const ok =
          r.status === "active" ? await addContact(r.email) : await unsubscribeContact(r.email);
        if (!ok) failed++;
        else if (r.status === "active") added++;
        else unsubscribed++;
        await sleep(GAP_MS);
      }

      if (more || rows.length < PAGE) break;
    }
  } catch (e) {
    console.error("newsletter: sync failed", e);
    return NextResponse.json(
      { ok: false, error: "Sync failed part-way. Re-run it — it's idempotent.", added, unsubscribed, failed },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, added, unsubscribed, failed, more });
}
