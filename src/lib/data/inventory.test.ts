import { describe, expect, it } from "vitest";

import type { SkillLevelKey } from "../skill-levels";

import { loadResumeData } from "./resume";

// Pinned production inventory from SPECIFICATION/spec.md §"Governed data source
// and predecessor import (phase 1)".
const SECTION_NAMES = [
  "Job History",
  "Formal Education",
  "Open-Source Projects Created/Contributed",
  "Writings, Publications, Presentations, and Awards",
  "Skills/Tools - Methodologies/Processes",
  "Skills/Tools - Frontend Languages/Libs/Frameworks",
  "Skills/Tools - Backend Languages/Libs/Frameworks",
  "Skills/Tools - Databases",
  "Skills/Tools - DevOps/SecOps/OS/Sysadmin",
  "Skills/Tools - Editors/IDEs",
  "Skills/Tools - Remote Working",
  "Skills/Tools - Networking",
  "Skills/Tools - Source Control",
  "Skills/Tools - Legacy/Mainframe",
  "Favorite Books/Articles",
  "Personal Info",
];

describe("committed governed source inventory", () => {
  it("round-trips the pinned production inventory (18 keys, 16 sections, 74 items)", () => {
    const result = loadResumeData();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(`load failed: ${result.error.kind}`);
    }
    const data = result.value;

    expect(data.metadata.topLevelKeyCount).toBe(18);
    expect(data.metadata.sectionCount).toBe(16);
    expect(data.sections).toHaveLength(16);
    expect(data.metadata.itemCount).toBe(74);
    expect(data.items).toHaveLength(74);

    // Sections in governed order with their verbatim display names.
    expect(data.sections.map((section) => section.name)).toEqual(SECTION_NAMES);
    // Ordinals are the 1-based governed position (legacy #list-<ordinal>).
    expect(data.sections.map((section) => section.ordinal)).toEqual(
      SECTION_NAMES.map((_, index) => index + 1),
    );
    // Every item carries a non-empty display name and a stable id.
    for (const item of data.items) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.id.length).toBeGreaterThan(0);
    }
    // The nested items across sections reproduce the flat 74-item inventory.
    const nested = data.sections.flatMap((section) => section.items);
    expect(nested).toHaveLength(74);
    // Only the five real production skill levels appear (no unspecified/invalid).
    const levels = new Set(
      data.items
        .map((item) => item.level)
        .filter((level): level is SkillLevelKey => level !== null),
    );
    expect([...levels].sort()).toEqual([
      "often",
      "once",
      "played",
      "teach",
      "toolbox",
    ]);
  });
});
