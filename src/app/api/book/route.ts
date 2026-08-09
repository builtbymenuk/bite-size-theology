import { NextResponse } from "next/server";
import { getBookCaleb } from "@/lib/cms";
import { validate, type BookingPayload } from "@/lib/booking";
import { sendResend } from "@/lib/mail";

export const runtime = "nodejs";

const STRAPI = process.env.STRAPI_URL;
const TOKEN = process.env.STRAPI_API_TOKEN;

// Best-effort persist to the Strapi Booking Request collection. A failed store must NEVER fail
// the request — the email to the pastor is the critical path.
async function store(d: BookingPayload): Promise<void> {
  if (!STRAPI || !TOKEN) return; // not configured → skip, email still goes out
  try {
    await fetch(`${STRAPI}/api/booking-requests`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          name: d.name,
          email: d.email,
          phone: d.phone,
          organization: d.organization,
          eventType: d.eventType,
          eventDate: d.eventDate,
          location: d.location,
          audienceSize: d.audienceSize,
          message: d.message,
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
  // Pastor's inbox. BOOKING_TO falls back to CONTACT_TO, then the page's direct-email address.
  const to = process.env.BOOKING_TO || process.env.CONTACT_TO || (await getBookCaleb()).directEmail.address;
  const emailed = await sendResend({
    to,
    replyTo: d.email,
    subject: `[Booking] ${d.eventType || "Speaking request"} — ${d.name} (${d.organization})`,
    text: [
      `Name: ${d.name}`,
      `Email: ${d.email}`,
      `Phone: ${d.phone || "(none)"}`,
      `Organization: ${d.organization}`,
      `Event type: ${d.eventType || "(none)"}`,
      `Preferred date(s): ${d.eventDate}`,
      `Location: ${d.location}`,
      `Audience size: ${d.audienceSize || "(not given)"}`,
      "",
      d.message,
    ].join("\n"),
  });

  if (!emailed) {
    return NextResponse.json(
      { ok: false, error: "We couldn't send your request right now. Please email us directly." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
