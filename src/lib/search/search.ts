// Interactive search over governed data (SPECIFICATION/contracts.md §"Search").
// Case-insensitive substring matching over each item's precomputed searchText
// (display name + DOM-free plain-text description projection). Matches are
// returned in canonical item order (filter preserves order); an empty query
// restores the full ordered list. This is a core module, so it returns Result.
import type { ResumeItem } from "../data/types";
import type { DomainError } from "../errors";

import { ok, type Result } from "../result";

export function filterBySearch(
  items: readonly ResumeItem[],
  query: string,
): Result<readonly ResumeItem[], DomainError> {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return ok(items);
  }
  return ok(
    items.filter((item) => item.searchText.toLowerCase().includes(normalized)),
  );
}
