import { describe, expect, it } from "vitest";

import {
  ALL_LEVEL_KEYS,
  DEFINED_LEVEL_KEYS,
  effectiveLevel,
  isDefinedLevel,
  levelMeaning,
  SKILL_LEVELS,
} from "./skill-levels";

describe("skill-level helpers", () => {
  it("exposes the six selectable level keys (five defined + unspecified)", () => {
    expect(DEFINED_LEVEL_KEYS).toEqual([
      "played",
      "once",
      "often",
      "toolbox",
      "teach",
    ]);
    expect(ALL_LEVEL_KEYS).toEqual([
      "played",
      "once",
      "often",
      "toolbox",
      "teach",
      "unspecified",
    ]);
    expect(SKILL_LEVELS).toHaveLength(6);
  });

  it("isDefinedLevel distinguishes defined keys from others", () => {
    expect(isDefinedLevel("teach")).toBe(true);
    expect(isDefinedLevel("unspecified")).toBe(false);
    expect(isDefinedLevel("guru")).toBe(false);
  });

  it("effectiveLevel maps a null level to unspecified", () => {
    expect(effectiveLevel(null)).toBe("unspecified");
    expect(effectiveLevel("teach")).toBe("teach");
  });

  it("levelMeaning returns the visitor-facing definition for a defined key", () => {
    expect(levelMeaning("teach")).toBe(
      "I know it in depth, I could teach a workshop or class on it",
    );
    expect(levelMeaning("played")).toBe("I have played around with it for fun");
  });
});
