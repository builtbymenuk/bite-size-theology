"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

// Reads a JSON value a previous page stashed in sessionStorage (the PayPal flows stash their result
// before routing to a thank-you page). useSyncExternalStore gives the server render `null` and the
// client the real value after hydration — no mismatch, and no setState-in-effect copy of it.
// The snapshot is the raw string, so it's referentially stable between renders.
export function useSessionJson<T>(key: string): T | null {
  const raw = useSyncExternalStore(
    noSubscribe,
    () => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null; // corrupt value → behave as if nothing was stashed
  }
}
