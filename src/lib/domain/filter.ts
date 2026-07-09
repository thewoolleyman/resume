// Skill-level filtering (SPECIFICATION/contracts.md §"Skill-level filtering").
// Items at a defined level are shown only when that level is selected; a
// no-level item behaves as `unspecified`. A present level is always one of the
// five defined keys — a present-but-non-defined value is rejected at load as
// malformed governed data — so there is no invalid-level visibility branch.
// This is a core module, so it returns Result.
import type { ResumeItem } from "../data/types";
import type { DomainError } from "../errors";

import { ok, type Result } from "../result";
import { effectiveLevel } from "../skill-levels";

export function filterBySkillLevels(
  items: readonly ResumeItem[],
  selected: ReadonlySet<string>,
): Result<readonly ResumeItem[], DomainError> {
  return ok(items.filter((item) => selected.has(effectiveLevel(item.level))));
}
