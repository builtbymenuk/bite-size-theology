import { beforeEach, describe, expect, test, vi } from "vitest";
import { withEnv } from "../../../../../../test/env";
import { stubFetch } from "../../../../../../test/fetch-stub";
import { jsonRequest, rawRequest } from "../../../../../../test/request";

const stripe = vi.hoisted(() => ({
  stripeConfigured: vi.fn(),
  createDonationSession: vi.fn(),
}));
vi.mock("@/lib/stripe", () => stripe);

const load = () => withEnv({}, () => import("./route"));
const PATH = "/api/donate/stripe/session";

beforeEach(() => {
  stripe.stripeConfigured.mockReset().mockReturnValue(true);
  stripe.createDonationSession.mockReset().mockResolvedValue({ url: "https://checkout.stripe.test/s" });
  stubFetch({}); // this route must never touch the network directly
});

describe("POST /api/donate/stripe/session", () => {
  test("503 when Stripe isn't configured", async () => {
    stripe.stripeConfigured.mockReturnValue(false);
    const { POST } = await load();
    expect((await POST(jsonRequest(PATH, { amount: 10 }))).status).toBe(503);
    expect(stripe.createDonationSession).not.toHaveBeenCalled();
  });

  test("400 on bad JSON", async () => {
    const { POST } = await load();
    expect((await POST(rawRequest(PATH, "x"))).status).toBe(400);
  });

  test.each([[0], [0.99], [50_000.01], ["abc"], [undefined]])("400 for amount %j", async (amount) => {
    const { POST } = await load();
    expect((await POST(jsonRequest(PATH, { amount }))).status).toBe(400);
    expect(stripe.createDonationSession).not.toHaveBeenCalled();
  });

  test("creates the session in cents with trimmed metadata; returns its url", async () => {
    const { POST } = await load();
    const res = await POST(
      jsonRequest(PATH, {
        amount: "25.50",
        name: "  Ada ",
        email: " ada@example.com ",
        fund: "Missions",
        message: "m".repeat(800),
        anonymous: 1,
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.test/s" });
    expect(stripe.createDonationSession).toHaveBeenCalledOnce();
    const opts = stripe.createDonationSession.mock.calls[0][0];
    expect(opts).toEqual({
      amountCents: 2550,
      currency: "USD",
      origin: "http://localhost:3000",
      metadata: {
        name: "Ada",
        email: "ada@example.com",
        fund: "Missions",
        message: "m".repeat(500),
        anonymous: "true",
      },
    });
  });

  test("blank/absent donor fields become empty strings (Stripe metadata must be strings)", async () => {
    const { POST } = await load();
    await POST(jsonRequest(PATH, { amount: 5 }));
    expect(stripe.createDonationSession.mock.calls[0][0].metadata).toEqual({
      name: "",
      email: "",
      fund: "",
      message: "",
      anonymous: "",
    });
  });

  test("502 when Stripe throws", async () => {
    stripe.createDonationSession.mockRejectedValue(new Error("stripe down"));
    const { POST } = await load();
    expect((await POST(jsonRequest(PATH, { amount: 5 }))).status).toBe(502);
  });
});
