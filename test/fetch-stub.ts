import { vi } from "vitest";

export type Call = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown; // parsed JSON when possible, else the raw string
};

type Reply =
  | Response
  | { status?: number; json?: unknown; text?: string }
  | ((call: Call) => Response | { status?: number; json?: unknown; text?: string } | Promise<never>);

const toResponse = (r: Exclude<Reply, (c: Call) => unknown>) => {
  if (r instanceof Response) return r;
  const status = r.status ?? 200;
  if (r.text !== undefined) return new Response(r.text, { status });
  return new Response(JSON.stringify(r.json ?? {}), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

// Routes fetch by URL substring: the FIRST matching key wins, so list specific paths before broad
// hosts. Anything unmatched throws — a test must declare every service the code under test reaches.
// A reply function may throw/reject to simulate a network failure.
export function stubFetch(routes: Record<string, Reply>) {
  const calls: Call[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = Object.fromEntries(new Headers(init.headers).entries());
    let body: unknown = init.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        /* keep the raw string */
      }
    }
    const call: Call = { url, method: (init.method ?? "GET").toUpperCase(), headers, body };
    calls.push(call);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) throw new Error(`stubFetch: no route for ${call.method} ${url}`);
    const reply = routes[key];
    const r = typeof reply === "function" ? await reply(call) : reply;
    return toResponse(r);
  });
  vi.stubGlobal("fetch", fn);
  return {
    calls,
    /** Calls whose URL contains `part`. */
    to: (part: string) => calls.filter((c) => c.url.includes(part)),
  };
}

/** A reply that simulates the network being down. */
export const networkError = () => Promise.reject(new TypeError("fetch failed"));
