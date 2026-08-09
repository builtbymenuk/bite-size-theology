import { NextResponse } from "next/server";
import { getContact } from "@/lib/cms";
import { validate, type ContactPayload } from "@/lib/contact";
import { sendResend } from "@/lib/mail";

export const runtime = "nodejs";

const STRAPI = process.env.STRAPI_URL;
const TOKEN = process.env.STRAPI_API_TOKEN;

// Best-effort persist to the Strapi Contact Message collection. Mirrors saveOrder in
// store-order.ts — a failed store must NEVER fail the request; the email is the critical path.
async function store(d: ContactPayload): Promise<void> {
  if (!STRAPI || !TOKEN) return; // not configured → skip, email still goes out
  try {
    await fetch(`${STRAPI}/api/contact-messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ data: { name: d.name, email: d.email, subject: d.subject, message: d.message } }),
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
  const to = process.env.CONTACT_TO || (await getContact()).email.address;
  const emailed = await sendResend({
    to,
    replyTo: d.email,
    subject: `[Contact] ${d.subject || "New message"} — ${d.name}`,
    text: `Name: ${d.name}\nEmail: ${d.email}\nSubject: ${d.subject || "(none)"}\n\n${d.message}`,
  });

  if (!emailed) {
    // Email is the critical path. Fail loud so the visitor knows to try again / use the mailto link.
    return NextResponse.json(
      { ok: false, error: "We couldn't send your message right now. Please email us directly." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
