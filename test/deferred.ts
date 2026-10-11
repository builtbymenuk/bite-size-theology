// A reply for stubFetch that doesn't settle until the test says so — lets a component test look at
// the in-flight ("Sending…") state before the response lands.
type Body = { status?: number; json?: unknown; text?: string };

export function deferredReply(body: Body = { json: { ok: true } }) {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  // stubFetch's reply type only admits Promise<never> for async replies (it was written for
  // network-failure stubs); it awaits whatever it gets, so a promise of a body works the same.
  const reply = (() => gate.then(() => body)) as unknown as () => Promise<never>;
  return { reply, release };
}
