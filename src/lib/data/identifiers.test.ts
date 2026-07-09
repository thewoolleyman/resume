import { describe, expect, it } from "vitest";

import { loadResumeData } from "./resume";
import { deriveItemIds, type ItemKey } from "./slugs";

function ids(keys: readonly ItemKey[]): readonly string[] {
  const result = deriveItemIds(keys);
  if (!result.ok) {
    throw new Error(result.error.kind);
  }
  return result.value;
}

describe("stable item identifier derivation", () => {
  it("derives stable item anchors deterministically with collision suffixes", () => {
    // Worked example from SPECIFICATION/spec.md §"Stable item identifiers".
    expect(
      ids([
        {
          sectionName: "Job History",
          itemName: "Senior Software Engineer, Pivotal",
        },
      ]),
    ).toEqual(["job-history-senior-software-engineer-pivotal"]);

    // The composed id is <section-slug>-<title-slug>; item-level collisions get
    // -2/-3 appended AFTER the join, in governed data order.
    expect(
      ids([
        { sectionName: "Skills", itemName: "Testing" },
        { sectionName: "Skills", itemName: "Testing" },
        { sectionName: "Skills", itemName: "Testing" },
      ]),
    ).toEqual(["skills-testing", "skills-testing-2", "skills-testing-3"]);

    // Section-level collision suffixes never participate: two items in
    // differently-named sections that slug to the same base still collide only
    // by their own composed id, and the id is a pure function of the two names
    // (independent of unrelated sections).
    const derived = ids([
      { sectionName: "A B", itemName: "X" },
      { sectionName: "C", itemName: "Y" },
    ]);
    expect(derived).toEqual(["a-b-x", "c-y"]);

    // Determinism: the same input yields the same output.
    const again = ids([
      {
        sectionName: "Job History",
        itemName: "Senior Software Engineer, Pivotal",
      },
    ]);
    expect(again).toEqual(["job-history-senior-software-engineer-pivotal"]);
  });

  it("assigns the pinned Pivotal anchor in the committed dataset", () => {
    const result = loadResumeData();
    if (!result.ok) {
      throw new Error(result.error.kind);
    }
    const pivotal = result.value.items.find(
      (item) => item.title === "Senior Software Engineer, Pivotal",
    );
    expect(pivotal?.id).toBe("job-history-senior-software-engineer-pivotal");
    // Every id is unique across the governed dataset.
    const allIds = result.value.items.map((item) => item.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
