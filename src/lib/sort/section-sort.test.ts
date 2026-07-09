import { describe, expect, it } from "vitest";

import type { ResumeItem } from "../data/types";

import { MISSING_END_SORT_KEY, MISSING_START_SORT_KEY } from "../data/dates";
import { SORT_OPTIONS, sortItems } from "./section-sort";

function item(overrides: Partial<ResumeItem> & { title: string }): ResumeItem {
  const base: ResumeItem = {
    id: overrides.title.toLowerCase(),
    title: overrides.title,
    level: null,
    start: null,
    end: null,
    startDisplay: "",
    endDisplay: "current",
    startSortKey: MISSING_START_SORT_KEY,
    endSortKey: MISSING_END_SORT_KEY,
    descriptionMarkdown: "",
    descriptionHtml: "",
    searchText: overrides.title,
  };
  return { ...base, ...overrides };
}

function titles(items: readonly ResumeItem[]): string[] {
  return items.map((entry) => entry.title);
}

function sorted(items: readonly ResumeItem[], option: string): string[] {
  const result = sortItems(items, option);
  if (!result.ok) {
    throw new Error(result.error.kind);
  }
  return titles(result.value);
}

describe("per-section sorting", () => {
  it("an invalid sort selection falls back to canonical default order", () => {
    const items = [item({ title: "Zed" }), item({ title: "Alpha" })];
    // An unrecognized option must not corrupt the order — it preserves the
    // canonical (input) order, exactly like Default.
    expect(sorted(items, "not-a-real-sort")).toEqual(["Zed", "Alpha"]);
    expect(sorted(items, "default")).toEqual(["Zed", "Alpha"]);
    // The original array is not mutated.
    expect(titles(items)).toEqual(["Zed", "Alpha"]);
  });

  it("exposes exactly the seven predecessor sort options in order", () => {
    expect(SORT_OPTIONS.map((option) => option.label)).toEqual([
      "Default",
      "Name Asc",
      "Name Desc",
      "Start Date Asc",
      "Start Date Desc",
      "End Date Asc",
      "End Date Desc",
    ]);
  });

  it("orders by item name ascending and descending", () => {
    const items = [
      item({ title: "Bravo" }),
      item({ title: "alpha" }),
      item({ title: "Charlie" }),
    ];
    expect(sorted(items, "name-asc")).toEqual(["alpha", "Bravo", "Charlie"]);
    expect(sorted(items, "name-desc")).toEqual(["Charlie", "Bravo", "alpha"]);
  });

  it("missing start sorts earliest; missing end sorts as current", () => {
    const withStart = item({ title: "Has", startSortKey: 1000 });
    const noStart = item({ title: "None" });
    expect(sorted([withStart, noStart], "start-asc")).toEqual(["None", "Has"]);
    expect(sorted([withStart, noStart], "start-desc")).toEqual(["Has", "None"]);

    const withEnd = item({ title: "Ended", endSortKey: 1000 });
    const noEnd = item({ title: "Current" });
    expect(sorted([withEnd, noEnd], "end-asc")).toEqual(["Ended", "Current"]);
    expect(sorted([withEnd, noEnd], "end-desc")).toEqual(["Current", "Ended"]);
  });

  it("breaks equal-date ties by item name in the sort's direction", () => {
    const a = item({ title: "Apple", startSortKey: 500 });
    const b = item({ title: "Banana", startSortKey: 500 });
    expect(sorted([b, a], "start-asc")).toEqual(["Apple", "Banana"]);
    expect(sorted([a, b], "start-desc")).toEqual(["Banana", "Apple"]);
  });
});
