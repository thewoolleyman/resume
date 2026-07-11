import { canonicalHref } from "$lib/canonical";

import type { LayoutLoad } from "./$types";

// Phase-1 reads governed data at build/prerender time and bakes it into the
// prerendered response (SPECIFICATION/constraints.md §"Performance and
// availability"), so every route is prerendered and performs no runtime fetch.
export const prerender = true;

// Each route self-canonicalizes to its own production URL; see $lib/canonical.
export const load: LayoutLoad = ({ url }) => ({
  canonical: canonicalHref(url.pathname),
});
