import { describe, expect, it } from "vitest";

import { type DomainError, presentError } from "./errors";

const MARKER = "LEAK_MARKER_ZZ";

// Every DomainError kind, with structured detail carrying a marker that must
// never surface in the visitor-facing message.
const ALL_ERRORS: readonly DomainError[] = [
  { kind: "yaml-parse", detail: MARKER },
  { kind: "not-a-mapping", detail: MARKER },
  { kind: "missing-about" },
  { kind: "missing-header" },
  { kind: "invalid-about", detail: MARKER },
  { kind: "invalid-header", detail: MARKER },
  { kind: "invalid-section", section: MARKER, detail: MARKER },
  { kind: "nameless-item", section: MARKER, index: 3 },
  { kind: "invalid-item", section: MARKER, index: 3, detail: MARKER },
  { kind: "invalid-level", section: MARKER, index: 3, value: MARKER },
  { kind: "invalid-date", field: MARKER, value: MARKER },
  { kind: "markdown-render", detail: MARKER },
];

describe("presentError", () => {
  it("returns a non-empty visitor-safe message for every DomainError kind", () => {
    for (const error of ALL_ERRORS) {
      const message = presentError(error);
      expect(message.length).toBeGreaterThan(0);
      // No structured detail / section / value leaks to the visitor.
      expect(message).not.toContain(MARKER);
    }
  });
});
