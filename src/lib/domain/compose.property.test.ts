import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { ResumeItem } from "../data/types";
import type { SkillLevelKey } from "../skill-levels";

import { ALL_LEVEL_KEYS } from "../skill-levels";
import { composeSection } from "./compose";

// Property target: search-filter-sort-composition (seed 4242).
const SEED = 4242;
const RUNS = 100;

const itemArb: fc.Arbitrary<ResumeItem> = fc
  .record({
    title: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,15}$/),
    level: fc.constantFrom<SkillLevelKey | null>(
      null,
      "played",
      "once",
      "often",
      "toolbox",
      "teach",
    ),
    startSortKey: fc.integer(),
    endSortKey: fc.integer(),
    searchText: fc.string(),
  })
  .map((raw) => ({
    id: raw.title.toLowerCase().replace(/\s+/g, "-"),
    title: raw.title,
    level: raw.level,
    start: null,
    end: null,
    startDisplay: "",
    endDisplay: "current",
    startSortKey: raw.startSortKey,
    endSortKey: raw.endSortKey,
    descriptionMarkdown: "",
    descriptionHtml: "",
    searchText: `${raw.title} ${raw.searchText}`,
  }));

const controlsArb = fc.record({
  query: fc.oneof(fc.constant(""), fc.string()),
  levels: fc.subarray([...ALL_LEVEL_KEYS]),
  sort: fc.constantFrom(
    "default",
    "name-asc",
    "name-desc",
    "start-asc",
    "start-desc",
    "end-asc",
    "end-desc",
    "bogus-sort",
  ),
});

describe("section composition properties", () => {
  it("is a deterministic subset of the input for any controls (fuzz)", () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { maxLength: 12 }),
        controlsArb,
        (items, controls) => {
          const inputIds = new Set(items.map((entry) => entry.id));
          const run = (): readonly ResumeItem[] => {
            const result = composeSection(items, {
              query: controls.query,
              selectedLevels: new Set(controls.levels),
              sort: controls.sort,
            });
            if (!result.ok) {
              throw new Error(result.error.kind);
            }
            return result.value;
          };
          const first = run();
          const second = run();
          // subset: every surviving item came from the input
          for (const entry of first) {
            expect(inputIds.has(entry.id)).toBe(true);
          }
          expect(first).toHaveLength(second.length);
          // deterministic: identical output across runs
          expect(first.map((e) => e.id)).toEqual(second.map((e) => e.id));
          // never grows the input
          expect(first.length).toBeLessThanOrEqual(items.length);
        },
      ),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it("empty query + all levels + default preserves the canonical order", () => {
    fc.assert(
      fc.property(fc.array(itemArb, { maxLength: 12 }), (items) => {
        const result = composeSection(items, {
          query: "",
          selectedLevels: new Set(ALL_LEVEL_KEYS),
          sort: "default",
        });
        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }
        expect(result.value.map((e) => e.id)).toEqual(items.map((e) => e.id));
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });
});
