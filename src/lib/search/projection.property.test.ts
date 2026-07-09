// @vitest-environment node
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { projectSearchText } from "./projection";

// Property target: markdown-and-html-strip-for-search (seed 4242). Runs in the
// node environment so a DOM dependency would throw.
const SEED = 4242;
const RUNS = 100;

// Single alphabetic token — no internal whitespace, so the projection's
// whitespace collapsing does not alter the term we assert on.
const prose = fc.stringMatching(/^[A-Za-z]{1,20}$/);

describe("search projection stripping properties", () => {
  it("never throws and never emits an HTML tag for arbitrary input", () => {
    fc.assert(
      fc.property(fc.string(), (markdown) => {
        const result = projectSearchText(markdown);
        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }
        // No residual HTML tag markup survives the strip.
        expect(result.value).not.toMatch(/<\/?[a-zA-Z][^>]*>/);
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it("keeps link text but drops the link-target URL (adversarial)", () => {
    fc.assert(
      fc.property(prose, (text) => {
        // A distinctive token placed only in the link target must not survive.
        const markdown = `[${text}](https://zzsecretzz.example/${text})`;
        const result = projectSearchText(markdown);
        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }
        expect(result.value.toLowerCase()).not.toContain("zzsecretzz");
        expect(result.value).toContain(text.trim());
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it("strips raw HTML tags (boundary/legacy) leaving text content", () => {
    fc.assert(
      fc.property(prose, (text) => {
        const result = projectSearchText(
          `<div data-x="zzattrzz">${text}</div>`,
        );
        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }
        expect(result.value).toContain(text.trim());
        expect(result.value).not.toContain("zzattrzz");
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });
});
