import { describe, expect, test } from "vitest";
import { withEnv } from "../../test/env";
import { networkError, stubFetch } from "../../test/fetch-stub";

const load = (env: Record<string, string> = { RESEND_API_KEY: "re_test" }) =>
  withEnv(env, () => import("./newsletter-audience"));

const CONTACT = "https://api.resend.com/contacts/jane%2Btag%40example.com";

describe("addContact", () => {
  test("creates the contact with POST and stops there when it succeeds", async () => {
    const { addContact } = await load();
    const net = stubFetch({ "api.resend.com/contacts": { json: { id: "c1" } } });
    expect(await addContact("jane+tag@example.com")).toBe(true);
    expect(net.calls).toHaveLength(1);
    const [c] = net.calls;
    expect(c.method).toBe("POST");
    expect(c.url).toBe("https://api.resend.com/contacts");
    expect(c.headers.authorization).toBe("Bearer re_test");
    expect(c.body).toEqual({ email: "jane+tag@example.com", unsubscribed: false });
  });

  test("includes the segment when RESEND_SEGMENT_ID is set", async () => {
    const { addContact } = await load({ RESEND_API_KEY: "re_test", RESEND_SEGMENT_ID: "seg_1" });
    const net = stubFetch({ "api.resend.com/contacts": { json: {} } });
    await addContact("jane@example.com");
    expect(net.calls[0].body).toEqual({
      email: "jane@example.com",
      unsubscribed: false,
      segments: [{ id: "seg_1" }],
    });
  });

  test("falls back to PATCHing unsubscribed:false when the create fails (already exists)", async () => {
    const { addContact } = await load();
    const net = stubFetch({
      "api.resend.com/contacts": (c) =>
        c.method === "POST" ? { status: 409, json: { message: "exists" } } : { json: {} },
    });
    expect(await addContact("jane+tag@example.com")).toBe(true);
    expect(net.calls.map((c) => c.method)).toEqual(["POST", "PATCH"]);
    expect(net.calls[1].url).toBe(CONTACT);
    expect(net.calls[1].body).toEqual({ unsubscribed: false });
  });

  test("false (never throws) when both create and patch fail", async () => {
    const { addContact } = await load();
    stubFetch({ "api.resend.com/contacts": networkError });
    await expect(addContact("jane@example.com")).resolves.toBe(false);
  });

  test("false and no request without RESEND_API_KEY", async () => {
    const { addContact, audienceConfigured } = await load({});
    const net = stubFetch({ "api.resend.com": { json: {} } });
    expect(audienceConfigured()).toBe(false);
    expect(await addContact("jane@example.com")).toBe(false);
    expect(net.calls).toHaveLength(0);
  });
});

describe("unsubscribeContact", () => {
  test("PATCHes the encoded contact with unsubscribed:true", async () => {
    const { unsubscribeContact, audienceConfigured } = await load();
    const net = stubFetch({ "api.resend.com/contacts": { json: {} } });
    expect(audienceConfigured()).toBe(true);
    expect(await unsubscribeContact("jane+tag@example.com")).toBe(true);
    expect(net.calls).toHaveLength(1);
    expect(net.calls[0]).toMatchObject({ method: "PATCH", url: CONTACT, body: { unsubscribed: true } });
  });

  test("false on a non-2xx response", async () => {
    const { unsubscribeContact } = await load();
    stubFetch({ "api.resend.com/contacts": { status: 500 } });
    expect(await unsubscribeContact("jane@example.com")).toBe(false);
  });

  test("false and no request without RESEND_API_KEY", async () => {
    const { unsubscribeContact } = await load({});
    const net = stubFetch({ "api.resend.com": { json: {} } });
    expect(await unsubscribeContact("jane@example.com")).toBe(false);
    expect(net.calls).toHaveLength(0);
  });
});
