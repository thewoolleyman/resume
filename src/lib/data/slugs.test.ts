import { describe, expect, it } from "vitest";

import { deriveSectionSlugs } from "./slugs";

function slugs(names: readonly string[]): readonly string[] {
  const result = deriveSectionSlugs(names);
  if (!result.ok) {
    throw new Error(result.error.kind);
  }
  return result.value;
}

describe("section slug derivation", () => {
  it("derives stable section slugs with -2/-3 collision suffixes", () => {
    // Production names with spaces, commas, slashes, hyphens, and long shared
    // prefixes slugify by lowercasing, collapsing non-alphanumeric runs to a
    // single hyphen, and trimming.
    expect(slugs(["Job History"])).toEqual(["job-history"]);
    expect(slugs(["Open-Source Projects Created/Contributed"])).toEqual([
      "open-source-projects-created-contributed",
    ]);
    expect(
      slugs([
        "Skills/Tools - Methodologies/Processes",
        "Skills/Tools - Frontend Languages/Libs/Frameworks",
      ]),
    ).toEqual([
      "skills-tools-methodologies-processes",
      "skills-tools-frontend-languages-libs-frameworks",
    ]);
    expect(
      slugs(["Writings, Publications, Presentations, and Awards"]),
    ).toEqual(["writings-publications-presentations-and-awards"]);

    // Collisions on the same base slug are disambiguated in governed order:
    // the first keeps the bare slug, later duplicates get -2/-3.
    expect(slugs(["Skills!!!", "Skills???", "Skills"])).toEqual([
      "skills",
      "skills-2",
      "skills-3",
    ]);
    // Leading/trailing non-alphanumerics are trimmed.
    expect(slugs(["  --Personal Info--  "])).toEqual(["personal-info"]);
  });
});
