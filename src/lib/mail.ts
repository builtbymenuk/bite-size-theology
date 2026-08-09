// Resend email sender, shared by the contact and booking routes. Server-only.
// ponytail: raw fetch over @resend/node — one call, no dependency.

const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM;

export interface Mail {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}

// Returns true if Resend accepted the send. False (never throws) when unconfigured or on a
// non-2xx response, so callers can treat email as a best-effort or critical path as they choose.
export async function sendResend(m: Mail): Promise<boolean> {
  if (!KEY || !FROM) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: m.to,
        reply_to: m.replyTo,
        subject: m.subject,
        text: m.text,
      }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
