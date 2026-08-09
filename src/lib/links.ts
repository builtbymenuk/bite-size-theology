// Shared link helpers for CMS-driven URLs. External http(s) links open in a new tab; internal
// "/path" links stay in-tab. A blank/undefined url yields no href (callers treat that as "inert").

export function isExternal(url?: string): boolean {
  return !!url && /^https?:\/\//i.test(url);
}

// Spread onto an <a>/<Link>: linkProps(url) → { href, target?, rel? }. Returns {} when url is blank
// so callers can do `const p = linkProps(url); p.href ? <a {...p}> : <inert>`.
export function linkProps(url?: string): { href?: string; target?: string; rel?: string } {
  const href = (url ?? "").trim();
  if (!href) return {};
  return isExternal(href)
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href };
}
