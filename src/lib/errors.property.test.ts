import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { type DomainError, presentError } from "./errors";

// Property target: domainerror-presentation-mapping (seed 4242).
const SEED = 4242;
const RUNS = 100;
const MARKER = "ZZLEAKZZ";

const tainted = fc.string().map((s) => MARKER + s);
const idx = fc.integer();

const errorArb: fc.Arbitrary<DomainError> = fc.oneof(
  tainted.map((detail) => ({ kind: "yaml-parse", detail }) as const),
  tainted.map((detail) => ({ kind: "not-a-mapping", detail }) as const),
  fc.constant({ kind: "missing-about" } as const),
  fc.constant({ kind: "missing-header" } as const),
  tainted.map((detail) => ({ kind: "invalid-about", detail }) as const),
  tainted.map((detail) => ({ kind: "invalid-header", detail }) as const),
  fc
    .record({ section: tainted, detail: tainted })
    .map((r) => ({ kind: "invalid-section", ...r }) as const),
  fc
    .record({ section: tainted, index: idx })
    .map((r) => ({ kind: "nameless-item", ...r }) as const),
  fc
    .record({ section: tainted, index: idx, detail: tainted })
    .map((r) => ({ kind: "invalid-item", ...r }) as const),
  fc
    .record({ field: tainted, value: tainted })
    .map((r) => ({ kind: "invalid-date", ...r }) as const),
  tainted.map((detail) => ({ kind: "markdown-render", detail }) as const),
);

describe("DomainError presentation mapping properties", () => {
  it("maps any DomainError to a non-empty, leak-free visitor message", () => {
    fc.assert(
      fc.property(errorArb, (error) => {
        const message = presentError(error);
        expect(message.length).toBeGreaterThan(0);
        expect(message).not.toContain(MARKER);
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });
});
