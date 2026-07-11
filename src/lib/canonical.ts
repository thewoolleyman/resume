// Canonical-URL derivation for the site's routes. Kept in a plain module (not
// +layout.ts, which only permits SvelteKit's reserved exports) so it can be
// imported by the layout load and unit-tested directly.

// The production origin is pinned so every route self-canonicalizes to its OWN
// production URL (/ → /, /static → /static). Using the absolute production
// origin — never the request origin — keeps Preview and Development deployments
// non-canonical: a preview of /static still points its canonical at production
// /static, so a preview URL is never presented as the canonical resume URL
// (SPECIFICATION/constraints.md §"Framework and deployment").
export const PRODUCTION_ORIGIN = "https://resume.thewoolleyweb.com";

export function canonicalHref(pathname: string): string {
  return `${PRODUCTION_ORIGIN}${pathname}`;
}
