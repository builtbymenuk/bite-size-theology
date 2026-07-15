// Server-only PayPal REST (Orders v2). No SDK — an OAuth token fetch plus create/capture calls.
// Only imported by the Node-runtime route handlers (it uses Buffer + server-only env, so importing
// it into a client bundle would fail to build — a natural guard). Never expose the secret client-side.
//
// Env: PAYPAL_CLIENT_SECRET + a client id, PAYPAL_ENV=sandbox|live.
// The client id is public in PayPal (the browser SDK needs it), so we accept it from either
// NEXT_PUBLIC_PAYPAL_CLIENT_ID (the one the client renders with) or an explicit PAYPAL_CLIENT_ID —
// a two-var setup (public id + secret) is enough, and keeps the UI gate and this server gate in sync.

const BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_CLIENT_SECRET;

export function paypalConfigured(): boolean {
  return Boolean(CLIENT_ID && SECRET);
}

async function accessToken(): Promise<string> {
  if (!CLIENT_ID || !SECRET) {
    throw new Error("PayPal not configured (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)");
  }
  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
  return (await res.json()).access_token as string;
}

async function api(path: string, body?: unknown): Promise<any> {
  const token = await accessToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      json?.details?.[0]?.description || json?.message || res.statusText;
    throw new Error(`PayPal ${path} failed (${res.status}): ${detail}`);
  }
  return json;
}

export interface PayPalLineItem {
  name: string;
  quantity: number;
  unitValue: string; // "45.00"
  description?: string;
}

// Build a v2 create-order body. item_total + shipping MUST equal the total, and
// Σ(unit_amount × quantity) MUST equal item_total, or PayPal rejects — computeTotals guarantees both.
export function buildCreateOrderBody(opts: {
  currency: string;
  items: PayPalLineItem[];
  itemTotal: string;
  shipping: string;
  total: string;
}) {
  const { currency, items, itemTotal, shipping, total } = opts;
  return {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: total,
          breakdown: {
            item_total: { currency_code: currency, value: itemTotal },
            shipping: { currency_code: currency, value: shipping },
          },
        },
        items: items.map((i) => ({
          name: i.name.slice(0, 127),
          quantity: String(i.quantity),
          unit_amount: { currency_code: currency, value: i.unitValue },
          ...(i.description ? { description: i.description.slice(0, 127) } : {}),
        })),
      },
    ],
  };
}

export async function createOrder(
  body: unknown,
): Promise<{ id: string; status: string }> {
  return api("/v2/checkout/orders", body);
}

export async function captureOrder(orderId: string): Promise<any> {
  return api(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {});
}
