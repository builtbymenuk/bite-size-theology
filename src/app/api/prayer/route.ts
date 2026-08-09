import { NextResponse } from "next/server";
import { validate, type PrayerPayload } from "@/lib/prayer";
import { sendResend } from "@/lib/mail";

export const runtime = "nodejs";

const STRAPI = process.env.STRAPI_URL;
const TOKEN = process.env.STRAPI_API_TOKEN;

// Best-effort persist to the Strapi Prayer Request collection. A failed store must NEVER fail the
// request — notifying the prayer team by email is the critical path.
async function store(d: PrayerPayload): Promise<void> {
  if (!STRAPI || !TOKEN) return; // not configured → skip, email still goes out
  try {
    await fetch(`${STRAPI}/api/prayer-requests`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          request: d.request,
          name: d.name || undefined,
          // Strapi's `email` field rejects "" — omit it entirely when the request is anonymous.
          email: d.email || undefined,
          urgent: d.urgent,
        },
      }),
      cache: "no-store",
    });
  } catch {
    // swallow — email is the path we surface to the visitor
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const v = validate(body);
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
  if (v.spam) return NextResponse.json({ ok: true }, { status: 200 }); // honeypot → silent drop

  await store(v.data); // best-effort
  const d = v.data;
  const to = process.env.PRAYER_TO || process.env.CONTACT_TO;
  const emailed = await sendResend({
    to: to || "",
    replyTo: d.email || undefined,
    subject: `${d.urgent ? "[URGENT] " : ""}[Prayer] Request from ${d.name || "Anonymous"}`,
    text: [
      `Name: ${d.name || "(anonymous)"}`,
      `Email: ${d.email || "(none)"}`,
      `Urgent: ${d.urgent ? "YES" : "no"}`,
      "",
      d.request,
    ].join("\n"),
  });

  if (!emailed) {
    return NextResponse.json(
      { ok: false, error: "We couldn't send your request right now. Please try again shortly." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
