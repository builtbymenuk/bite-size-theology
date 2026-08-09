import { NextResponse } from "next/server";
import { captureOrder, paypalConfigured } from "@/lib/paypal";
import { saveDonation, donationExists, type DonorMeta } from "@/lib/donation";

export const runtime = "nodejs";

// Captures the approved PayPal donation, then best-effort records it. The amount comes straight
// from PayPal's capture (authoritative); donor fields come from the client meta (non-financial).
export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "PayPal giving is not configured." }, { status: 503 });
  }

  let orderID = "";
  let meta: DonorMeta = {};
  try {
    const body = await req.json();
    orderID = String(body?.orderID ?? "");
    meta = (body?.meta ?? {}) as DonorMeta;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!orderID) return NextResponse.json({ error: "Missing order id." }, { status: 400 });

  let capture: any;
  try {
    capture = await captureOrder(orderID);
  } catch (e) {
    console.error("donate/paypal/capture: failed", e);
    return NextResponse.json({ error: "Payment could not be completed." }, { status: 502 });
  }
  if (capture?.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Payment was not completed.", status: capture?.status },
      { status: 402 },
    );
  }

  const pu = capture?.purchase_units?.[0] ?? {};
  const cap = pu?.payments?.captures?.[0] ?? {};
  const payer = capture?.payer ?? {};
  const amount = Number(cap?.amount?.value ?? 0);
  const currency = cap?.amount?.currency_code || "USD";

  const existing = await donationExists("paypal", capture.id);
  if (!existing) {
    await saveDonation({
      amount,
      currency,
      name:
        meta.name ||
        [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(" ") ||
        undefined,
      email: meta.email || payer?.email_address || undefined,
      fund: meta.fund || undefined,
      message: meta.message || undefined,
      anonymous: !!meta.anonymous,
      provider: "paypal",
      paypalOrderId: capture.id,
      paypalCaptureId: cap?.id || undefined,
    }).catch((e) => console.error("donate/paypal/capture: save failed", e));
  }

  return NextResponse.json({ ok: true, amount, currency });
}
