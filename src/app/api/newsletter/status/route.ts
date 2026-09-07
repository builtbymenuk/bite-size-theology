import { NextResponse, type NextRequest } from "next/server";
import { SUBSCRIBED_COOKIE } from "@/lib/newsletter-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// What the popup asks before deciding to show itself. The cookie is httpOnly, so the browser can't
// answer this question on its own — hence the round trip. See newsletter-store.ts for why this is
// the closest thing to cross-device suppression available without a login.
export async function GET(req: NextRequest) {
  const subscribed = req.cookies.get(SUBSCRIBED_COOKIE)?.value === "1";
  const res = NextResponse.json({ subscribed });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
