// The two transactional emails behind the double opt-in. Plain text, like every other email the
// site sends — sendResend has no html field and adding one for two messages isn't worth it.
import { sendResend } from "./mail";

// Absolute links for the emails. SITE_URL wins in production (behind Passenger the request's own
// origin can be an internal host); locally the request origin is already right, so nothing to set.
export function siteUrl(req: Request): string {
  return (process.env.SITE_URL || new URL(req.url).origin).replace(/\/+$/, "");
}

export const confirmUrl = (origin: string, token: string) =>
  `${origin}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

export const unsubscribeUrl = (origin: string, token: string) =>
  `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;

// Sent on signup and on every legitimate re-signup. Until this link is clicked the address stays
// pending and receives nothing else — that is the whole point of double opt-in: someone typing a
// stranger's address into the form cannot subscribe them.
export function sendConfirmation(origin: string, to: string, token: string): Promise<boolean> {
  return sendResend({
    to,
    subject: "Confirm your Bite Size Theology subscription",
    text: [
      "Thanks for signing up to Bite Size Theology.",
      "",
      "One click and you're on the list:",
      confirmUrl(origin, token),
      "",
      "If that wasn't you, just ignore this email — nothing happens until the link is clicked,",
      "and we won't email you again.",
    ].join("\n"),
  });
}

// Sent once, the moment they confirm. Carries the unsubscribe link so every list email from here
// on has an obvious way out.
export function sendWelcome(origin: string, to: string, token: string): Promise<boolean> {
  return sendResend({
    to,
    subject: "You're on the list — Bite Size Theology",
    text: [
      "You're in. Thanks for subscribing to Bite Size Theology.",
      "",
      "Expect one short study a week — Scripture, unpacked, nothing else.",
      "",
      "Changed your mind? Unsubscribe any time:",
      unsubscribeUrl(origin, token),
    ].join("\n"),
  });
}
