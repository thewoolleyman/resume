// Harness test for the comment-discipline gate. Pins the accept/reject
// boundary of SPECIFICATION/non-functional-requirements.md §"Comment discipline"
// Rule 2: a rotting historical-bookkeeping reference in a comment is rejected;
// the same text inside a string literal, a durable spec-section pointer, an
// exempt tree, or ratified delivery-phase vocabulary is accepted.

import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { checkComments } from "./check-comments";

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function git(cwd: string, ...args: readonly string[]): void {
  Bun.spawnSync({ cmd: ["git", ...args], cwd });
}

function makeRepo(files: Readonly<Record<string, string>>): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-comments-fixture-"));
  fixtures.push(dir);
  git(dir, "init", "-q", "-b", "master");
  git(dir, "config", "user.email", "comments@example.invalid");
  git(dir, "config", "user.name", "Fixture");
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  git(dir, "add", "-A");
  return dir;
}

// Banned marker samples live only in these string constants and in fixture
// content, never in a comment — the gate scans comments, not string literals.
const WORK_ITEM = "li-6tntj5";
const PLAN_PATH = "plan/guardrail/research/findings.md";
const SHA = "15d9b21f";
const VERSION = "v028";

describe("comment-discipline gate", () => {
  test("accepts WHY-form comments and durable spec-section pointers", () => {
    const dir = makeRepo({
      "scripts/x.ts":
        "// The retry budget is bounded by the upstream rate limiter.\n" +
        '// Per SPECIFICATION/non-functional-requirements.md §"Comment discipline".\n' +
        "export const x = 1;\n",
    });
    expect(checkComments(dir).ok).toBe(true);
  });

  test("rejects a work-item id in a comment", () => {
    const dir = makeRepo({
      "scripts/x.ts": `// closes ${WORK_ITEM}\nexport {};\n`,
    });
    const result = checkComments(dir);
    expect(result.ok).toBe(false);
    expect(result.violations[0]?.marker).toBe("work-item id");
  });

  test("rejects a plan-thread path, design-doc slice, version, SHA, PR, and watcher phrase", () => {
    const dir = makeRepo({
      "scripts/a.ts": `// see ${PLAN_PATH} slice 8\nexport {};\n`,
      "scripts/b.ts": `// worktree-mandatory since ${VERSION}\nexport {};\n`,
      "scripts/c.ts": `// watcher fix on ${SHA}\nexport {};\n`,
      "scripts/d.ts": `// closed by PR #2\nexport {};\n`,
    });
    const markers = checkComments(dir).violations.map((v) => v.marker);
    expect(markers).toContain("plan-thread path");
    expect(markers).toContain("design-document reference");
    expect(markers).toContain("spec version marker");
    expect(markers).toContain("commit sha");
    expect(markers).toContain("pull-request number");
    expect(markers).toContain("bookkeeping phrase");
  });

  test("rejects a line-number anchor", () => {
    const dir = makeRepo({
      "scripts/x.ts": "// see lines 12-18\nexport {};\n",
    });
    const result = checkComments(dir);
    expect(result.ok).toBe(false);
    expect(result.violations[0]?.marker).toBe("line-number anchor");
  });

  test("ignores banned text inside a string literal, never a comment", () => {
    const dir = makeRepo({
      "scripts/x.ts": `export const id = ${JSON.stringify(WORK_ITEM)};\nexport const path = ${JSON.stringify(PLAN_PATH)};\n`,
    });
    expect(checkComments(dir).ok).toBe(true);
  });

  test("does not scan exempt trees (SPECIFICATION, plan, archive)", () => {
    const dir = makeRepo({
      "SPECIFICATION/note.ts": `// ${WORK_ITEM} ${PLAN_PATH}\n`,
      "plan/x/note.ts": `// ${WORK_ITEM}\n`,
      "archive/note.ts": `// ${WORK_ITEM}\n`,
    });
    expect(checkComments(dir).ok).toBe(true);
  });

  test("does not flag ratified 'phase' vocabulary or hyphenated words", () => {
    const dir = makeRepo({
      "scripts/x.ts":
        "// phase 1 targets, the in-process gate, re-export.\nexport {};\n",
    });
    expect(checkComments(dir).ok).toBe(true);
  });

  test("scans YAML hash comments in workflows", () => {
    const dir = makeRepo({
      ".github/workflows/ci.yml": `# closes ${WORK_ITEM}\njobs: {}\n`,
    });
    const result = checkComments(dir);
    expect(result.ok).toBe(false);
    expect(result.violations[0]?.marker).toBe("work-item id");
  });

  test("scans HTML comments in Svelte markup", () => {
    const dir = makeRepo({
      "src/App.svelte": `<!-- see ${PLAN_PATH} -->\n<div></div>\n`,
    });
    const result = checkComments(dir);
    expect(result.ok).toBe(false);
    expect(result.violations[0]?.marker).toBe("plan-thread path");
  });

  test("catches comments after template literals and regex (robust extraction)", () => {
    const dir = makeRepo({
      "scripts/x.ts":
        "const t = `a ${1} b`;\nconst r = /a\\/b/;\n// closes " +
        WORK_ITEM +
        "\nexport {};\n",
    });
    const result = checkComments(dir);
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.marker === "work-item id")).toBe(
      true,
    );
  });
});
