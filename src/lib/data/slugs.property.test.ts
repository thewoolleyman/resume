import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { deriveItemIds, deriveSectionSlugs } from "./slugs";

// Reproducibility metadata mirrors property.config.json (seed 4242; fast run
// count). Property target: item-and-section-slug-derivation.
const SEED = 4242;
const RUNS = 100;

// Generator classes for the malformed/adversarial/boundary/legacy mix so the
// fuzzing dial is not discharged by happy-path names alone.
const label = fc.oneof(
  // valid-domain: ordinary display names
  fc.constantFrom("Job History", "Formal Education", "Personal Info"),
  // legacy-compatibility: names with hyphens, slashes, commas, shared prefixes
  fc.constantFrom(
    "Open-Source Projects Created/Contributed",
    "Skills/Tools - Databases",
    "Writings, Publications, Presentations, and Awards",
  ),
  // adversarial: punctuation, unicode, mixed case, whitespace runs
  fc.string(),
  fc.stringMatching(/^[!@#$%^&*()/\-. ]*$/),
  // boundary: empty and single-character
  fc.constantFrom("", "A", "-", "  "),
);

describe("slug derivation properties", () => {
  it("section slugs: length-preserving, deterministic, and unique", () => {
    fc.assert(
      fc.property(fc.array(label, { maxLength: 12 }), (names) => {
        const first = deriveSectionSlugs(names);
        const second = deriveSectionSlugs(names);
        expect(first.ok && second.ok).toBe(true);
        if (!first.ok || !second.ok) {
          return;
        }
        // length preserved
        expect(first.value).toHaveLength(names.length);
        // deterministic
        expect(first.value).toEqual(second.value);
        // collision disambiguation makes every derived slug unique
        expect(new Set(first.value).size).toBe(first.value.length);
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it("item ids: composed as <section>-<title>, deterministic, unique", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ sectionName: label, itemName: label }), {
          maxLength: 12,
        }),
        (keys) => {
          const result = deriveItemIds(keys);
          expect(result.ok).toBe(true);
          if (!result.ok) {
            return;
          }
          expect(result.value).toHaveLength(keys.length);
          expect(new Set(result.value).size).toBe(result.value.length);
          // Determinism against a repeat derivation.
          const repeat = deriveItemIds(keys);
          expect(repeat.ok && repeat.value).toEqual(result.value);
        },
      ),
      { seed: SEED, numRuns: RUNS },
    );
  });
});
