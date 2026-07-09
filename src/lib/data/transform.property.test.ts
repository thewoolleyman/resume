import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { transformResume } from "./transform";

// Property target: governed-yaml-parse-reject (seed 4242).
const SEED = 4242;
const RUNS = 200;

// adversarial YAML-ish inputs plus arbitrary strings.
const adversarial = fc.oneof(
  fc.string(),
  fc.constantFrom(
    "[",
    "{",
    "about: [1, 2",
    "a: b: c",
    "- one\n- two",
    ": : :",
    "\t\tbad",
    "",
    "about:\n  title: t",
  ),
);

describe("governed YAML parse/transform rejection properties", () => {
  it("returns a Result and never throws for arbitrary input (fuzz)", () => {
    fc.assert(
      fc.property(adversarial, (input) => {
        const result = transformResume(input);
        // Either Ok or Err, but always a discriminated Result — no throw.
        expect(typeof result.ok).toBe("boolean");
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it("rejects a source missing the required about group", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z]{1,10}$/), (name) => {
        const yaml = `header:\n  name: ${name}\n  contact: ${name}\n`;
        const result = transformResume(yaml);
        expect(result.ok).toBe(false);
        if (result.ok) {
          return;
        }
        expect(result.error.kind).toBe("missing-about");
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it("rejects a source missing the required header group", () => {
    const result = transformResume("about:\n  title: t\n  content: c\n");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("missing-header");
    }
  });

  it("accepts a well-formed minimal governed source (valid-domain)", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[A-Za-z][A-Za-z ]{0,15}$/), (text) => {
        const yaml = [
          "about:",
          `  title: ${text}`,
          `  content: ${text}`,
          "header:",
          `  name: ${text}`,
          `  contact: ${text}`,
          "Section:",
          `  - name: ${text} item`,
          `    desc: ${text}`,
          "",
        ].join("\n");
        const result = transformResume(yaml);
        expect(result.ok).toBe(true);
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });
});
