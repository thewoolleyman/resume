import { describe, expect, it } from "vitest";

import type { ResumeItem } from "../data/types";
import type { SkillLevelKey } from "../skill-levels";

import { ALL_LEVEL_KEYS } from "../skill-levels";
import { filterBySkillLevels } from "./filter";

function item(title: string, level: SkillLevelKey | null): ResumeItem {
  return {
    id: title.toLowerCase(),
    title,
    level,
    start: null,
    end: null,
    startDisplay: "",
    endDisplay: "current",
    startSortKey: 0,
    endSortKey: 0,
    descriptionMarkdown: "",
    descriptionHtml: "",
    searchText: title,
  };
}

function visible(
  items: readonly ResumeItem[],
  selected: Iterable<string>,
): string[] {
  const result = filterBySkillLevels(items, new Set(selected));
  if (!result.ok) {
    throw new Error(result.error.kind);
  }
  return result.value.map((entry) => entry.title);
}

describe("skill-level filtering", () => {
  const items = [
    item("Teaches", "teach"),
    item("Played", "played"),
    item("NoLevel", null),
  ];

  it("shows everything when all levels are selected (default)", () => {
    expect(visible(items, ALL_LEVEL_KEYS)).toEqual([
      "Teaches",
      "Played",
      "NoLevel",
    ]);
  });

  it("shows only items at a selected defined level", () => {
    expect(visible(items, ["teach"])).toEqual(["Teaches"]);
  });

  it("treats a no-level item as unspecified for filtering", () => {
    expect(visible(items, ["unspecified"])).toEqual(["NoLevel"]);
    expect(visible(items, ["played"])).toEqual(["Played"]);
  });

  it("hides every item when no level is selected", () => {
    expect(visible(items, [])).toEqual([]);
  });
});
