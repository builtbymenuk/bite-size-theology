import { describe, expect, test } from "vitest";
import { withEnv } from "../../test/env";
import { networkError, stubFetch } from "../../test/fetch-stub";

const RESEND = { RESEND_API_KEY: "re_test", RESEND_FROM: "Bite Size <hello@test.dev>" };
const load = (env: Record<string, string> = RESEND) => withEnv(env, () => import("./mail"));

const mail = { to: "pastor@test.dev", replyTo: "ada@example.com", subject: "Hi", text: "Body" };

describe("sendResend", () => {
  test("false and no request when RESEND_API_KEY is unset", async () => {
    const { sendResend } = await load({ RESEND_FROM: RESEND.RESEND_FROM });
    const net = stubFetch({ "api.resend.com": { json: {} } });
    expect(await sendResend(mail)).toBe(false);
    expect(net.calls).toHaveLength(0);
  });

  test("false and no request when RESEND_FROM is unset", async () => {
    const { sendResend } = await load({ RESEND_API_KEY: RESEND.RESEND_API_KEY });
    const net = stubFetch({ "api.resend.com": { json: {} } });
    expect(await sendResend(mail)).toBe(false);
    expect(net.calls).toHaveLength(0);
  });

  test("posts the expected payload with a Bearer key and returns true on 2xx", async () => {
    const { sendResend } = await load();
    const net = stubFetch({ "api.resend.com/emails": { json: { id: "email_1" } } });
    expect(await sendResend(mail)).toBe(true);

    expect(net.calls).toHaveLength(1);
    const [call] = net.calls;
    expect(call.url).toBe("https://api.resend.com/emails");
    expect(call.method).toBe("POST");
    expect(call.headers.authorization).toBe("Bearer re_test");
    expect(call.headers["content-type"]).toBe("application/json");
    expect(call.body).toEqual({
      from: "Bite Size <hello@test.dev>",
      to: "pastor@test.dev",
      reply_to: "ada@example.com",
      subject: "Hi",
      text: "Body",
    });
  });

  test("omits reply_to when none is given", async () => {
    const { sendResend } = await load();
    const net = stubFetch({ "api.resend.com/emails": { json: {} } });
    await sendResend({ to: "a@test.dev", subject: "s", text: "t" });
    expect(net.calls[0].body).not.toHaveProperty("reply_to");
  });

  test("false on a non-2xx response", async () => {
    const { sendResend } = await load();
    stubFetch({ "api.resend.com/emails": { status: 422, json: { message: "bad from" } } });
    expect(await sendResend(mail)).toBe(false);
  });

  test("false (never throws) when the network is down", async () => {
    const { sendResend } = await load();
    stubFetch({ "api.resend.com/emails": networkError });
    await expect(sendResend(mail)).resolves.toBe(false);
  });
});
