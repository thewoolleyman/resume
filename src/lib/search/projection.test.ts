// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildSearchText, projectSearchText } from "./projection";

function text(markdown: string): string {
  const result = projectSearchText(markdown);
  if (!result.ok) {
    throw new Error(result.error.kind);
  }
  return result.value;
}

describe("DOM-free search projection", () => {
  it("generates the plain-text projection without document or window", () => {
    // This spec runs in the node environment: there is no browser DOM, so a
    // projection that touched document/window would throw here.
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");

    // A term that appears only inside a markdown link target (an <a> tag
    // attribute) is dropped; the visible link text and surrounding prose stay.
    const projected = text(
      "_[Lean Startup](http://theleanstartup.com/principles)_ style validated learning",
    );
    expect(projected).toContain("Lean Startup");
    expect(projected).toContain("validated");
    expect(projected.toLowerCase()).not.toContain("theleanstartup");

    // Inline code spans and emphasis strip to their text content.
    expect(text("`process_helper` is **great** and _fun_")).toBe(
      "process_helper is great and fun",
    );

    // Raw HTML tags (and their attributes) are removed; entities are decoded.
    expect(text('<span class="x">A &amp; B</span>')).toBe("A & B");
  });

  it("combines the item title with its projected description", () => {
    const combined = buildSearchText("Growth / Lean", "validated learning");
    if (!combined.ok) {
      throw new Error(combined.error.kind);
    }
    expect(combined.value).toContain("Growth / Lean");
    expect(combined.value).toContain("validated learning");
  });
});
