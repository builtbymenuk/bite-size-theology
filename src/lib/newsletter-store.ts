// The Strapi seam for newsletter subscribers, plus the cookie that records "this browser is on the
// list" — both sides of one subscription's state, so they live together.
//
// Unlike the store() helpers in the contact/prayer/book routes, these do NOT swallow failures.
// There the email is the critical path and the saved row is a bonus; here the row IS the
// subscription — an unsaved subscriber is a lost subscriber with a dead confirmation link — so
// callers surface a 500 rather than pretending it worked.
import { randomBytes } from "node:crypto";
import type { NextResponse } from "next/server";

const BASE = process.env.STRAPI_URL;
const TOKEN = process.env.STRAPI_API_TOKEN;
const PATH = "newsletter-subscribers";

export type Status = "pending" | "active" | "unsubscribed";

export interface Subscriber {
  documentId: string;
  email: string;
  status: Status;
  confirmToken: string;
  source: "footer" | "popup";
}

export interface SubscriberWrite {
  email?: string;
  status?: Status;
  confirmToken?: string;
  subscribedAt?: string;
  confirmedAt?: string | null;
  source?: "footer" | "popup";
}

// Writes need a token; there is no useful degraded mode, so routes check this and 503 up front
// rather than failing halfway through a signup.
export const configured = (): boolean => Boolean(BASE && TOKEN);

// 32 random bytes, URL-safe. Doubles as the unsubscribe key so one column covers both links —
// long enough that guessing one is not a realistic path to someone else's subscription.
export const newToken = (): string => randomBytes(32).toString("base64url");

// Only the fields this module reads. Strapi returns plenty more; nothing here needs it.
interface StrapiRow {
  documentId?: string;
  email?: string;
  subscriptionStatus?: string;
  confirmToken?: string;
  source?: string;
}

// The column is `subscriptionStatus`, not `status`, and that is not cosmetic: Strapi 5's Content
// Manager overwrites any attribute literally named `status` with the document's own draft/publish
// state, so the admin form receives "published" instead of the stored value — the dropdown renders
// empty and the row cannot be saved. The public REST API is unaffected, which is what makes it easy
// to miss. The rest of the app still says `status`; the translation lives here at the seam.
const toStrapi = ({ status, ...rest }: SubscriberWrite) =>
  status === undefined ? rest : { ...rest, subscriptionStatus: status };

async function call(
  path: string,
  init?: { method: string; body: unknown },
): Promise<{ data?: StrapiRow | StrapiRow[] }> {
  if (!configured()) throw new Error("newsletter: STRAPI_URL / STRAPI_API_TOKEN are not set");
  const res = await fetch(`${BASE}/api/${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: init ? JSON.stringify({ data: init.body }) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`newsletter: Strapi ${init?.method ?? "GET"} ${path} -> ${res.status}`);
  return res.json();
}

// A list query returns an array, a create/update returns a single object — normalize both.
const first = (d?: StrapiRow | StrapiRow[]): StrapiRow | undefined =>
  Array.isArray(d) ? d[0] : d;

const row = (d?: StrapiRow): Subscriber | null =>
  d?.documentId
    ? {
        documentId: d.documentId,
        email: String(d.email ?? ""),
        status: (d.subscriptionStatus ?? "pending") as Status,
        confirmToken: String(d.confirmToken ?? ""),
        source: d.source === "popup" ? "popup" : "footer",
      }
    : null;

async function findOneBy(field: "email" | "confirmToken", value: string): Promise<Subscriber | null> {
  if (!value) return null;
  const q = `filters[${field}][$eq]=${encodeURIComponent(value)}&pagination[pageSize]=1`;
  return row(first((await call(`${PATH}?${q}`)).data));
}

export const findByEmail = (email: string) => findOneBy("email", email);
export const findByToken = (token: string) => findOneBy("confirmToken", token);

// One page of the collection, oldest first so a paged walk is stable while rows are being added.
// Used only by the reconcile route; nothing on the request path reads the whole list.
export async function listSubscribers(page: number, pageSize: number): Promise<Subscriber[]> {
  const q = `sort=createdAt:asc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
  const d = (await call(`${PATH}?${q}`)).data;
  return (Array.isArray(d) ? d : []).map(row).filter((r): r is Subscriber => r !== null);
}

export async function create(data: SubscriberWrite): Promise<Subscriber | null> {
  return row(first((await call(PATH, { method: "POST", body: toStrapi(data) })).data));
}

export async function update(documentId: string, data: SubscriberWrite): Promise<Subscriber | null> {
  return row(first((await call(`${PATH}/${documentId}`, { method: "PUT", body: toStrapi(data) })).data));
}

// --- The "this browser is on the list" cookie -------------------------------------------------
//
// The only cross-device signal available without a login. It is set both when someone submits the
// form and when they click the link in the confirmation email — and that second one usually lands
// on a different device from the first, which is what actually spreads suppression beyond one
// browser. httpOnly so page scripts can neither read nor forge it, which is why the popup asks the
// server (/api/newsletter/status) instead of reading document.cookie.

export const SUBSCRIBED_COOKIE = "bst_nl";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // a year — a mailing list is a long-lived relationship
};

export function setSubscribedCookie<T extends NextResponse>(res: T): T {
  res.cookies.set(SUBSCRIBED_COOKIE, "1", cookieOptions);
  return res;
}

export function clearSubscribedCookie<T extends NextResponse>(res: T): T {
  res.cookies.set(SUBSCRIBED_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
