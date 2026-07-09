import { describe, expect, it } from "vitest";

import {
  deriveDateFields,
  MISSING_END_SORT_KEY,
  MISSING_START_SORT_KEY,
  NBSP,
  parseIsoDate,
} from "./dates";

describe("parseIsoDate", () => {
  it("parses a bare calendar date as UTC", () => {
    const result = parseIsoDate("start", "2006-04-15");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.getUTCFullYear()).toBe(2006);
    expect(result.value.getUTCMonth()).toBe(3);
    expect(result.value.getUTCDate()).toBe(15);
  });

  it("parses an optional time component", () => {
    const result = parseIsoDate("start", "2006-04-15T13:30:45Z");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.getUTCHours()).toBe(13);
    expect(result.value.getUTCMinutes()).toBe(30);
    expect(result.value.getUTCSeconds()).toBe(45);
  });

  it("rejects malformed shapes and out-of-range fields", () => {
    for (const bad of [
      "not-a-date",
      "",
      "2006-4-5",
      "2021-00-10", // month < 1
      "2021-13-10", // month > 12
      "2021-01-00", // day < 1
      "2021-01-32", // day > 31
      "2021-02-30", // day overflows the month
      "2021-01-01T24:00:00", // hour > 23
      "2021-01-01T10:60:00", // minute > 59
      "2021-01-01T10:10:60", // second > 59
    ]) {
      const result = parseIsoDate("start", bad);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("invalid-date");
      }
    }
  });
});

describe("deriveDateFields (four presence combinations)", () => {
  it("present start + present end", () => {
    const result = deriveDateFields("2006-04-15", "2019-10-29");
    expect(result.ok && result.value).toEqual({
      startDisplay: `4.2006${NBSP}-`,
      endDisplay: "10.2019",
      startSortKey: Date.UTC(2006, 3, 15),
      endSortKey: Date.UTC(2019, 9, 29),
    });
    // The separator is the non-breaking space (U+00A0), not an ordinary space.
    if (result.ok) {
      expect(result.value.startDisplay.charCodeAt(6)).toBe(0x00a0);
    }
  });

  it("present start + missing end -> current", () => {
    const result = deriveDateFields("2001-07-02", null);
    if (!result.ok) {
      throw new Error(result.error.kind);
    }
    expect(result.value.startDisplay).toBe(`7.2001${NBSP}-`);
    expect(result.value.endDisplay).toBe("current");
    expect(result.value.endSortKey).toBe(MISSING_END_SORT_KEY);
  });

  it("missing start + present end -> until", () => {
    const result = deriveDateFields(null, "2001-08-02");
    if (!result.ok) {
      throw new Error(result.error.kind);
    }
    expect(result.value.startDisplay).toBe("until");
    expect(result.value.endDisplay).toBe("8.2001");
    expect(result.value.startSortKey).toBe(MISSING_START_SORT_KEY);
  });

  it("missing start + missing end -> empty / current", () => {
    const result = deriveDateFields(null, null);
    expect(result.ok && result.value).toEqual({
      startDisplay: "",
      endDisplay: "current",
      startSortKey: MISSING_START_SORT_KEY,
      endSortKey: MISSING_END_SORT_KEY,
    });
  });

  it("propagates an invalid start or end date", () => {
    const badStart = deriveDateFields("nope", null);
    expect(badStart.ok).toBe(false);
    if (!badStart.ok) {
      expect(badStart.error.kind).toBe("invalid-date");
    }
    const badEnd = deriveDateFields(null, "2021-13-01");
    expect(badEnd.ok).toBe(false);
    if (!badEnd.ok) {
      expect(badEnd.error.kind).toBe("invalid-date");
    }
  });
});
