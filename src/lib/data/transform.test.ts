import { describe, expect, it } from "vitest";

import { transformResume } from "./transform";

function kind(yaml: string): string {
  const result = transformResume(yaml);
  if (result.ok) {
    throw new Error("expected transform to reject, but it succeeded");
  }
  return result.error.kind;
}

const HEADER = "header:\n  name: N\n  contact: C\n";
const ABOUT = "about:\n  title: T\n  content: c\n";

describe("transformResume malformed-structure rejection", () => {
  it("rejects a non-mapping about group", () => {
    expect(kind(`about: not-a-mapping\n${HEADER}`)).toBe("invalid-about");
  });

  it("rejects about with a non-string title or content", () => {
    expect(kind(`about:\n  title: 5\n  content: c\n${HEADER}`)).toBe(
      "invalid-about",
    );
  });

  it("rejects a non-mapping header group", () => {
    expect(kind(`${ABOUT}header: not-a-mapping\n`)).toBe("invalid-header");
  });

  it("rejects header with a non-string name or contact", () => {
    expect(kind(`${ABOUT}header:\n  name: [x]\n  contact: C\n`)).toBe(
      "invalid-header",
    );
  });

  it("rejects a section whose value is not an array", () => {
    expect(kind(`${ABOUT}${HEADER}Skills: not-a-list\n`)).toBe(
      "invalid-section",
    );
  });

  it("rejects a section item that is not a mapping", () => {
    expect(kind(`${ABOUT}${HEADER}Skills:\n  - just-a-string\n`)).toBe(
      "invalid-item",
    );
  });

  it("rejects a non-string desc field", () => {
    expect(
      kind(`${ABOUT}${HEADER}Skills:\n  - name: X\n    desc: [a, b]\n`),
    ).toBe("invalid-item");
  });
});

describe("transformResume optional-field handling", () => {
  it("accepts an item with explicit null level/start and no desc", () => {
    const result = transformResume(
      `${ABOUT}${HEADER}Skills:\n  - name: Solo\n    level:\n    start:\n`,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const item = result.value.items[0];
    expect(item?.level).toBeNull();
    expect(item?.start).toBeNull();
    // Absent desc defaults to an empty markdown string.
    expect(item?.descriptionMarkdown).toBe("");
    expect(item?.descriptionHtml).toBe("");
  });

  it("groups items under their governed section in order", () => {
    const result = transformResume(
      `${ABOUT}${HEADER}First:\n  - name: A\n    desc: a\nSecond:\n  - name: B\n    desc: b\n`,
    );
    if (!result.ok) {
      throw new Error(result.error.kind);
    }
    expect(result.value.sections.map((s) => s.name)).toEqual([
      "First",
      "Second",
    ]);
    expect(result.value.sections[0]?.items.map((i) => i.title)).toEqual(["A"]);
    expect(result.value.sections[1]?.items.map((i) => i.title)).toEqual(["B"]);
    expect(result.value.metadata.topLevelKeyCount).toBe(4);
  });
});
