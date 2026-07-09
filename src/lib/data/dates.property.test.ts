import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  deriveDateFields,
  MISSING_END_SORT_KEY,
  MISSING_START_SORT_KEY,
  NBSP,
  parseIsoDate,
} from "./dates";

// Property target: date-parse-render-sort (seed 4242).
const SEED = 4242;
const RUNS = 100;

const pad = (n: number): string => String(n).padStart(2, "0");

// valid-domain: real calendar dates (day <= 28 avoids month-length edges).
const validDate = fc
  .record({
    year: fc.integer({ min: 1900, max: 2100 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }),
  })
  .map(({ year, month, day }) => ({
    iso: `${String(year)}-${pad(month)}-${pad(day)}`,
    year,
    month,
  }));

// malformed / adversarial / boundary date scalars.
const badDate = fc.oneof(
  fc.string(),
  fc.constantFrom(
    "not-a-date",
    "2021-13-01",
    "2021-02-30",
    "2021-00-10",
    "0000-00-00",
    "2021-1-1",
    "",
  ),
);

describe("date parse/render/sort properties", () => {
  it("valid ISO dates round-trip through parseIsoDate in UTC", () => {
    fc.assert(
      fc.property(validDate, ({ iso, year, month }) => {
        const parsed = parseIsoDate("start", iso);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
          return;
        }
        expect(parsed.value.getUTCFullYear()).toBe(year);
        expect(parsed.value.getUTCMonth()).toBe(month - 1);
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it("derives the predecessor date columns for a present start", () => {
    fc.assert(
      fc.property(validDate, ({ iso, year, month }) => {
        const fields = deriveDateFields(iso, null);
        expect(fields.ok).toBe(true);
        if (!fields.ok) {
          return;
        }
        // present start + missing end -> "M.YYYY<nbsp>-" and "current".
        expect(fields.value.startDisplay).toBe(
          `${String(month)}.${String(year)}${NBSP}-`,
        );
        expect(fields.value.endDisplay).toBe("current");
        expect(fields.value.endSortKey).toBe(MISSING_END_SORT_KEY);
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it("missing start/end map to the earliest/current sort sentinels", () => {
    const fields = deriveDateFields(null, null);
    expect(fields.ok && fields.value).toEqual({
      startDisplay: "",
      endDisplay: "current",
      startSortKey: MISSING_START_SORT_KEY,
      endSortKey: MISSING_END_SORT_KEY,
    });
  });

  it("never throws for malformed date scalars; adversarial values are rejected", () => {
    fc.assert(
      fc.property(badDate, (value) => {
        const parsed = parseIsoDate("start", value);
        expect(typeof parsed.ok).toBe("boolean");
      }),
      { seed: SEED, numRuns: RUNS },
    );
    for (const value of ["2021-13-01", "2021-02-30", "2021-00-10", "nope"]) {
      expect(parseIsoDate("start", value).ok).toBe(false);
    }
  });
});
