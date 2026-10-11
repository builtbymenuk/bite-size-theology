// Builders for the Request objects route handlers receive.
export const BASE = "http://localhost:3000";

export function jsonRequest(
  path: string,
  body: unknown,
  { ip = "203.0.113.7", headers = {} as Record<string, string> } = {},
) {
  return new Request(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip, ...headers },
    body: JSON.stringify(body),
  });
}

export function rawRequest(path: string, raw: string, init: RequestInit = {}) {
  return new Request(BASE + path, { method: "POST", body: raw, ...init });
}

export function getRequest(path: string, headers: Record<string, string> = {}) {
  return new Request(BASE + path, { headers });
}
