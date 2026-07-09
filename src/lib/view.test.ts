import { afterEach, describe, expect, it, vi } from "vitest";

import type { ResumeItem } from "./data/types";

import { toggleInSet } from "./view";

function item(title: string, searchText: string): ResumeItem {
  return {
    id: title.toLowerCase(),
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

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("toggleInSet", () => {
  it("adds a missing key and removes a present one, returning a new set", () => {
    const base = new Set(["a"]);
    const added = toggleInSet(base, "b");
    expect([...added].sort()).toEqual(["a", "b"]);
    expect(added).not.toBe(base);
    const removed = toggleInSet(base, "a");
    expect([...removed]).toEqual([]);
  });
});

describe("composeOrOriginal", () => {
  it("returns the composed items on success", async () => {
    const { composeOrOriginal } = await import("./view");
    const items = [item("Alpha", "alpha ruby"), item("Bravo", "bravo js")];
    const composed = composeOrOriginal(items, {
      query: "ruby",
      selectedLevels: new Set(["unspecified"]),
      sort: "default",
    });
    expect(composed.map((entry) => entry.title)).toEqual(["Alpha"]);
  });

  it("falls back to the original items if composition errors", async () => {
    vi.doMock("./domain/compose", () => ({
      composeSection: () => ({ ok: false, error: { kind: "yaml-parse" } }),
    }));
    const { composeOrOriginal } = await import("./view");
    const items = [item("Alpha", "alpha")];
    const result = composeOrOriginal(items, {
      query: "",
      selectedLevels: new Set(),
      sort: "default",
    });
    expect(result).toBe(items);
  });
});
