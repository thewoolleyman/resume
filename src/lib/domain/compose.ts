// Deterministic composition of the interactive controls
// (SPECIFICATION/contracts.md §"Search"): a section first restricts to the
// items matching the current query, then applies skill-level filtering, then
// applies the chosen sort. The surviving items stay in canonical order before
// the sort is applied. This is the single per-section pipeline the interactive
// UI calls; it is a core module and returns Result.
import type { ResumeItem } from "../data/types";
import type { DomainError } from "../errors";

import { andThen, type Result } from "../result";
import { filterBySearch } from "../search/search";
import { sortItems } from "../sort/section-sort";
import { filterBySkillLevels } from "./filter";

export interface ComposeControls {
  readonly query: string;
  readonly selectedLevels: ReadonlySet<string>;
  readonly sort: string;
}

export function composeSection(
  items: readonly ResumeItem[],
  controls: ComposeControls,
): Result<readonly ResumeItem[], DomainError> {
  // Chained with andThen so composeSection has no error branches of its own:
  // search -> filter -> sort, each stage's Err short-circuiting.
  return andThen(filterBySearch(items, controls.query), (searched) =>
    andThen(
      filterBySkillLevels(searched, controls.selectedLevels),
      (filtered) => sortItems(filtered, controls.sort),
    ),
  );
}
