// Browser-side memory for the newsletter popup: has this person already signed up here, and when
// did they last close it. Every read and write is wrapped — Safari private mode throws on
// localStorage, and a broken popup gate must never take a page down with it.
//
// This is the fast local gate only. The authoritative cross-device signal is the httpOnly cookie
// the API sets (see newsletter-store.ts); this exists so the popup never flashes while that round
// trip is in flight.

const KEY = "bst-newsletter"; // matches the bst-cart / bst-last-order convention
const SEEN_KEY = "bst-newsletter-seen";
const DISMISS_DAYS = 30;
const DAY_MS = 86_400_000;

interface Memo {
  subscribed?: boolean;
  dismissedUntil?: number;
}

function read(): Memo {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as Memo) : {};
  } catch {
    return {}; // storage off, or someone hand-edited it into nonsense
  }
}

function write(patch: Memo): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {
    // storage off — the server cookie still covers this browser
  }
}

export const rememberSubscribed = (): void => write({ subscribed: true });

export const rememberDismissed = (): void =>
  write({ dismissedUntil: Date.now() + DISMISS_DAYS * DAY_MS });

// True when the popup has nothing left to offer: they're on the list, or they closed it inside the
// last 30 days.
export function suppressed(): boolean {
  const m = read();
  if (m.subscribed) return true;
  return typeof m.dismissedUntil === "number" && m.dismissedUntil > Date.now();
}

// Once per tab. Client-side navigation keeps the popup mounted anyway; this is what stops a reload
// mid-session from restarting the timer and showing it a second time in one sitting.
export function seenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSeenThisSession(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // storage off — worst case they see it again after a reload
  }
}
