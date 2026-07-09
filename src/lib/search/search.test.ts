import { describe, expect, it } from "vitest";

import type { ResumeItem } from "../data/types";

import { loadResumeData } from "../data/resume";
import { filterBySearch } from "./search";

function item(title: string, searchText: string): ResumeItem {
  return {
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    level: null,
    start: null,
    end: null,
    startDisplay: "",
    endDisplay: "current",
    startSortKey: 0,
    endSortKey: 0,
    descriptionMarkdown: "",
    descriptionHtml: "",
    searchText,
  };
}

function matches(items: readonly ResumeItem[], query: string): string[] {
  const result = filterBySearch(items, query);
  if (!result.ok) {
    throw new Error(result.error.kind);
  }
  return result.value.map((entry) => entry.title);
}

describe("interactive search", () => {
  it("is case-insensitive, substring, and preserves canonical order", () => {
    const items = [
      item("Alpha", "Alpha uses Ruby and Rails"),
      item("Bravo", "Bravo uses JavaScript"),
      item("Charlie", "Charlie uses RUBY on rails"),
    ];
    expect(matches(items, "ruby")).toEqual(["Alpha", "Charlie"]);
    expect(matches(items, "RUBY")).toEqual(["Alpha", "Charlie"]);
    // Empty / whitespace query restores the full ordered list.
    expect(matches(items, "")).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(matches(items, "   ")).toEqual(["Alpha", "Bravo", "Charlie"]);
    // No match yields an empty list (the no-results state, upstream).
    expect(matches(items, "cobol")).toEqual([]);
  });

  it("matches the pinned governed worked example (validated / theleanstartup)", () => {
    const result = loadResumeData();
    if (!result.ok) {
      throw new Error(result.error.kind);
    }
    const items = result.value.items;

    // `validated` matches exactly the Growth / Lean item and no other.
    const validated = matches(items, "validated");
    expect(validated).toEqual(["Growth / Lean"]);

    // `theleanstartup` appears only inside a markdown link URL, so it matches
    // zero items.
    expect(matches(items, "theleanstartup")).toEqual([]);
  });
});
