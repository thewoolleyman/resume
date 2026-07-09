// Per-section sorting (SPECIFICATION/contracts.md §"Per-section sorting"): the
// seven visitor-facing sort options with predecessor semantics — Default keeps
// canonical governed order; name sorts use locale-aware comparison; date sorts
// use the precomputed sort keys (missing start orders earliest, missing end
// orders as current) with item-name tie-breakers in the sort's own direction.
// An unrecognized sort selection falls back to canonical default order rather
// than corrupting the rendered order. This is a core module, so it returns
// Result.
import type { ResumeItem } from "../data/types";
import type { DomainError } from "../errors";

import { ok, type Result } from "../result";

export interface SortOption {
  readonly id: string;
  readonly label: string;
}

export const SORT_OPTIONS: readonly SortOption[] = [
  { id: "default", label: "Default" },
  { id: "name-asc", label: "Name Asc" },
  { id: "name-desc", label: "Name Desc" },
  { id: "start-asc", label: "Start Date Asc" },
  { id: "start-desc", label: "Start Date Desc" },
  { id: "end-asc", label: "End Date Asc" },
  { id: "end-desc", label: "End Date Desc" },
];

export const DEFAULT_SORT = "default";

type DateKey = "startSortKey" | "endSortKey";

function compareName(a: ResumeItem, b: ResumeItem, direction: number): number {
  return direction * Math.sign(a.title.localeCompare(b.title));
}

function compareByDate(
  a: ResumeItem,
  b: ResumeItem,
  key: DateKey,
  direction: number,
): number {
  const primary = Math.sign(a[key] - b[key]);
  // Ties on the sort date break on the item name in the sort's own direction.
  const cmp =
    primary !== 0 ? primary : Math.sign(a.title.localeCompare(b.title));
  return direction * cmp;
}

export function sortItems(
  items: readonly ResumeItem[],
  option: string,
): Result<readonly ResumeItem[], DomainError> {
  const copy = [...items];
  switch (option) {
    case "name-asc":
      return ok(copy.sort((a, b) => compareName(a, b, 1)));
    case "name-desc":
      return ok(copy.sort((a, b) => compareName(a, b, -1)));
    case "start-asc":
      return ok(copy.sort((a, b) => compareByDate(a, b, "startSortKey", 1)));
    case "start-desc":
      return ok(copy.sort((a, b) => compareByDate(a, b, "startSortKey", -1)));
    case "end-asc":
      return ok(copy.sort((a, b) => compareByDate(a, b, "endSortKey", 1)));
    case "end-desc":
      return ok(copy.sort((a, b) => compareByDate(a, b, "endSortKey", -1)));
    // "default" and any unrecognized selection preserve canonical order.
    default:
      return ok(copy);
  }
}
