// Deterministic stable identifier derivation (SPECIFICATION/spec.md §"Stable
// item identifiers" and §"Stable section identifiers"). The algorithm is
// pinned so two independent implementations produce byte-identical anchors:
// slugify each label (lowercase, collapse each run of non-alphanumeric
// characters to a single hyphen, trim leading/trailing hyphens), then
// disambiguate composed-identifier collisions with -2/-3/... in governed data
// order. Section-level collision suffixes never participate in an item id, so
// an item id is a pure function of its own section and item display names.
// This is a core module, so its public API returns Result.
import type { DomainError } from "../errors";

import { ok, type Result } from "../result";

export interface ItemKey {
  readonly sectionName: string;
  readonly itemName: string;
}

// The shared slugification algorithm (kept internal; the public API returns
// collision-resolved slug lists as Result per the core-module discipline).
function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Appends -2/-3/... to duplicate base identifiers in the order they appear, so
// the first occurrence keeps the bare slug and later collisions are numbered.
function disambiguate(bases: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return bases.map((base) => {
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${String(count)}`;
  });
}

// Section slugs: slugify each display name, then disambiguate collisions in
// governed data order. This slug is the canonical section anchor.
export function deriveSectionSlugs(
  names: readonly string[],
): Result<readonly string[], DomainError> {
  return ok(disambiguate(names.map(slugify)));
}

// Item ids: compose the BASE section slug, a single hyphen, and the item title
// slug, then disambiguate the composed ids in governed data order. Section-level
// collision suffixes are intentionally excluded from the composition.
export function deriveItemIds(
  keys: readonly ItemKey[],
): Result<readonly string[], DomainError> {
  const bases = keys.map(
    ({ sectionName, itemName }) =>
      `${slugify(sectionName)}-${slugify(itemName)}`,
  );
  return ok(disambiguate(bases));
}
