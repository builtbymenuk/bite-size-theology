import { vi } from "vitest";

// Modules in this app copy process.env into constants at import time, so a test must set env
// FIRST and then import a fresh copy of the module under test. This does both.
export async function withEnv<T>(env: Record<string, string>, load: () => Promise<T>): Promise<T> {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  vi.resetModules();
  return load();
}

// A typical "everything configured" environment pointing at fake hosts only.
export const CONFIGURED = {
  STRAPI_URL: "http://strapi.test",
  STRAPI_API_TOKEN: "test-token",
  RESEND_API_KEY: "re_test",
  RESEND_FROM: "Bite Size <hello@test.dev>",
  CONTACT_TO: "contact@test.dev",
  SITE_URL: "https://site.test",
} as const;
