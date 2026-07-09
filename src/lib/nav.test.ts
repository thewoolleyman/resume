import { describe, expect, it, vi } from "vitest";

import type { ResumeItem, ResumeSection } from "./data/types";

import { resolveAnchor, revealAnchor } from "./nav";

function section(
  id: string,
  ordinal: number,
  itemIds: readonly string[],
): ResumeSection {
  const items = itemIds.map((itemId): ResumeItem => ({
    id: itemId,
    title: itemId,
    level: null,
    start: null,
    end: null,
    startDisplay: "",
    endDisplay: "current",
    startSortKey: 0,
    endSortKey: 0,
    descriptionMarkdown: "",
    descriptionHtml: "",
    searchText: itemId,
  }));
  return { id, ordinal, name: id, items };
}

const sections = [
  section("job-history", 1, ["job-history-role"]),
  section("skills", 2, []),
];

describe("resolveAnchor", () => {
  it("resolves a section slug anchor", () => {
    expect(resolveAnchor("#job-history", sections)).toBe("job-history");
    // Without the leading '#'.
    expect(resolveAnchor("job-history", sections)).toBe("job-history");
  });

  it("resolves an item id anchor", () => {
    expect(resolveAnchor("#job-history-role", sections)).toBe(
      "job-history-role",
    );
  });

  it("resolves a legacy #list-<ordinal> alias to the section slug", () => {
    expect(resolveAnchor("#list-1", sections)).toBe("job-history");
    expect(resolveAnchor("#list-2", sections)).toBe("skills");
  });

  it("is a no-op (null) for an out-of-range ordinal, unknown, or empty hash", () => {
    expect(resolveAnchor("#list-99", sections)).toBeNull();
    expect(resolveAnchor("#does-not-exist", sections)).toBeNull();
    expect(resolveAnchor("", sections)).toBeNull();
    expect(resolveAnchor("#", sections)).toBeNull();
  });
});

describe("revealAnchor", () => {
  it("scrolls the resolved element into view and reports success", () => {
    const scrollIntoView = vi.fn();
    const doc = {
      getElementById: (id: string) =>
        id === "job-history"
          ? ({ scrollIntoView } as unknown as HTMLElement)
          : null,
    };
    expect(revealAnchor("#job-history", sections, doc)).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it("is a no-op for an unresolvable hash", () => {
    const doc = { getElementById: () => null };
    expect(revealAnchor("#nope", sections, doc)).toBe(false);
  });

  it("is a no-op when the resolved element is not in the document", () => {
    const doc = { getElementById: () => null };
    // The hash resolves to a real section id, but the element is absent.
    expect(revealAnchor("#job-history", sections, doc)).toBe(false);
  });
});
