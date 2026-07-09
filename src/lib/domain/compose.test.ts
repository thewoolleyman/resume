import { describe, expect, it } from "vitest";

import type { ResumeItem } from "../data/types";
import type { SkillLevelKey } from "../skill-levels";

import { composeSection } from "./compose";

function item(
  title: string,
  level: SkillLevelKey | null,
  startSortKey: number,
): ResumeItem {
  return {
    id: title.toLowerCase(),
    title,
    level,
    start: null,
    end: null,
    startDisplay: "",
    endDisplay: "current",
    startSortKey,
    endSortKey: 0,
    descriptionMarkdown: "",
    descriptionHtml: "",
    searchText: `${title} common`,
  };
}

function compose(
  items: readonly ResumeItem[],
  query: string,
  levels: Iterable<string>,
  sort: string,
): string[] {
  const result = composeSection(items, {
    query,
    selectedLevels: new Set(levels),
    sort,
  });
  if (!result.ok) {
    throw new Error(result.error.kind);
  }
  return result.value.map((entry) => entry.title);
}

describe("section composition (search -> filter -> sort)", () => {
  const items = [
    item("Gamma", "teach", 300),
    item("Alpha", "played", 100),
    item("Beta", "teach", 200),
  ];

  it("applies search, then skill filter, then sort in that order", () => {
    // All match "common"; deselect "played" (drops Alpha); sort by name asc.
    expect(compose(items, "common", ["teach"], "name-asc")).toEqual([
      "Beta",
      "Gamma",
    ]);
    // Same filter, sort by start date ascending.
    expect(compose(items, "common", ["teach"], "start-asc")).toEqual([
      "Beta",
      "Gamma",
    ]);
  });

  it("restricts to query matches before filtering and sorting", () => {
    const mixed = [
      item("Match One", "teach", 10),
      { ...item("Other", "teach", 5), searchText: "unrelated text" },
    ];
    expect(compose(mixed, "match", ["teach"], "default")).toEqual([
      "Match One",
    ]);
  });

  it("an empty query with all levels restores the default ordered view", () => {
    expect(compose(items, "", ["played", "teach"], "default")).toEqual([
      "Gamma",
      "Alpha",
      "Beta",
    ]);
  });
});
