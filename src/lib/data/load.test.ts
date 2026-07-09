import { describe, expect, it } from "vitest";

import { loadResumeData } from "./resume";
import { transformResume } from "./transform";

const MINIMAL = [
  "about:",
  "  title: About",
  "  content: hello **world**",
  "header:",
  "  name: Someone",
  "  contact: somewhere",
  "Job History:",
  "  - name: A Role",
  "    desc: did things",
  "",
].join("\n");

describe("governed data load", () => {
  it("malformed governed data fails the phase-1 build-time load", () => {
    const noAbout = transformResume("header:\n  name: N\n  contact: C\n");
    expect(noAbout.ok).toBe(false);
    if (!noAbout.ok) {
      expect(noAbout.error.kind).toBe("missing-about");
    }

    const noHeader = transformResume("about:\n  title: T\n  content: c\n");
    expect(noHeader.ok).toBe(false);
    if (!noHeader.ok) {
      expect(noHeader.error.kind).toBe("missing-header");
    }

    const nameless = transformResume(
      "about:\n  title: T\n  content: c\nheader:\n  name: N\n  contact: C\nS:\n  - desc: no name here\n",
    );
    expect(nameless.ok).toBe(false);
    if (!nameless.ok) {
      expect(nameless.error.kind).toBe("nameless-item");
    }
  });

  it("an invalid skill level fails the phase-1 build-time load", () => {
    // A present item `level` that is a well-formed string but not one of the
    // five defined keys is malformed governed data (SPECIFICATION/scenarios.md
    // §"Invalid skill level is rejected at load"): rejected at load so the
    // invalid data never ships, exactly like a missing group or nameless item.
    const invalidLevel = transformResume(
      "about:\n  title: T\n  content: c\nheader:\n  name: N\n  contact: C\nSkills:\n  - name: Legacy\n    level: guru\n    desc: d\n",
    );
    expect(invalidLevel.ok).toBe(false);
    if (!invalidLevel.ok) {
      expect(invalidLevel.error.kind).toBe("invalid-level");
    }
  });

  it("tolerates deferred skills/relationships/rich-metadata collections as empty", () => {
    const result = transformResume(MINIMAL);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.kind);
    }
    expect(result.value.skills).toEqual([]);
    expect(result.value.relationships).toEqual([]);
    expect(result.value.sections).toHaveLength(1);
    expect(result.value.items).toHaveLength(1);

    // The committed production source likewise carries no taxonomy/relationships.
    const real = loadResumeData();
    if (!real.ok) {
      throw new Error(real.error.kind);
    }
    expect(real.value.skills).toEqual([]);
    expect(real.value.relationships).toEqual([]);
  });

  it("a governed data failure fails the build so the broken resume never ships", () => {
    // Unparseable YAML (unclosed flow sequence).
    const badYaml = transformResume("about: [1, 2\n");
    expect(badYaml.ok).toBe(false);
    if (!badYaml.ok) {
      expect(badYaml.error.kind).toBe("yaml-parse");
    }

    // A non-mapping root.
    const notMapping = transformResume("- just\n- a\n- list\n");
    expect(notMapping.ok).toBe(false);
    if (!notMapping.ok) {
      expect(notMapping.error.kind).toBe("not-a-mapping");
    }

    // A present-but-invalid date STRING is a domain failure that fails the build.
    const badDate = transformResume(
      "about:\n  title: T\n  content: c\nheader:\n  name: N\n  contact: C\nS:\n  - name: Item\n    start: not-a-date\n    desc: d\n",
    );
    expect(badDate.ok).toBe(false);
    if (!badDate.ok) {
      expect(badDate.error.kind).toBe("invalid-date");
    }

    // A present-but-non-string date scalar (numeric) is rejected, never coerced
    // to a silent "missing".
    const numericDate = transformResume(
      "about:\n  title: T\n  content: c\nheader:\n  name: N\n  contact: C\nS:\n  - name: Item\n    start: 123\n    desc: d\n",
    );
    expect(numericDate.ok).toBe(false);
    if (!numericDate.ok) {
      expect(numericDate.error.kind).toBe("invalid-date");
    }

    // A present-but-non-string date scalar (array) is likewise rejected.
    const arrayDate = transformResume(
      "about:\n  title: T\n  content: c\nheader:\n  name: N\n  contact: C\nS:\n  - name: Item\n    end: [bad]\n    desc: d\n",
    );
    expect(arrayDate.ok).toBe(false);
    if (!arrayDate.ok) {
      expect(arrayDate.error.kind).toBe("invalid-date");
    }

    // A present-but-non-string level is malformed and rejected.
    const badLevel = transformResume(
      "about:\n  title: T\n  content: c\nheader:\n  name: N\n  contact: C\nS:\n  - name: Item\n    level: 7\n    desc: d\n",
    );
    expect(badLevel.ok).toBe(false);
    if (!badLevel.ok) {
      expect(badLevel.error.kind).toBe("invalid-item");
    }
  });
});
