// Harness test for the no-live-git-jsonl gate (plan/orchestrator-migration
// slice 4). Pins: the retired git-jsonl orchestrator is not referenced as a
// live surface anywhere in the tracked tree, while migration-history locations
// (immutable spec history, the archived store, the migrated beads pointer, and
// the migration thread itself) are excluded — and every OTHER plan thread is
// still scanned so a live reference cannot hide there.

import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { checkNoGitJsonl } from "./check-no-git-jsonl";

const repoRoot = join(import.meta.dir, "..");
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
  const dir = mkdtempSync(join(tmpdir(), "resume-nogitjsonl-fixture-"));
  fixtures.push(dir);
  git(dir, "init", "-q", "-b", "master");
  git(dir, "config", "user.email", "nogitjsonl@example.invalid");
  git(dir, "config", "user.name", "Fixture");
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  git(dir, "add", "-A");
  return dir;
}

// The retired orchestrator plugin id, used to build fixture content. This test
// file is excluded from the gate (see EXCLUDE_PATHSPECS), so the literal here
// is not a spurious live reference.
const LIVE = "livespec-orchestrator-git-jsonl";

describe("no-live-git-jsonl gate (slice 4)", () => {
  test("passes a tracked tree with no git-jsonl reference", () => {
    const dir = makeRepo({
      "AGENTS.md": "the beads-fabro next ranking\n",
      "README.md": "dogfoods the beads-fabro orchestrator\n",
    });
    expect(checkNoGitJsonl(dir).ok).toBe(true);
  });

  test("flags a live git-jsonl reference, naming the file and line", () => {
    const dir = makeRepo({ "AGENTS.md": `run the ${LIVE} next skill\n` });
    const result = checkNoGitJsonl(dir);
    expect(result.ok).toBe(false);
    expect(result.violations.join("\n")).toContain("AGENTS.md");
  });

  test("excludes migration-history locations (history, archive incl. the archived migration thread, .beads)", () => {
    const dir = makeRepo({
      "AGENTS.md": "beads-fabro\n",
      "SPECIFICATION/history/v001/non-functional-requirements.md":
        "the git-jsonl orchestrator\n",
      "archive/work-items.jsonl": '{"note":"git-jsonl store"}\n',
      ".beads/config.yaml": "# migrated from the retired git-jsonl store\n",
      // The orchestrator-migration thread is archived under archive/, covered
      // by the archive/ exclusion (no separate plan-path exclusion needed).
      "archive/orchestrator-migration/handoff.md":
        "migrate from git-jsonl to beads-fabro\n",
    });
    expect(checkNoGitJsonl(dir).ok).toBe(true);
  });

  test("still flags git-jsonl in a NON-excluded plan thread (mvp)", () => {
    const dir = makeRepo({
      "plan/mvp/handoff.md": `run the ${LIVE} next skill\n`,
    });
    const result = checkNoGitJsonl(dir);
    expect(result.ok).toBe(false);
    expect(result.violations.join("\n")).toContain("plan/mvp/handoff.md");
  });

  test("passes on the current repository tree", () => {
    const result = checkNoGitJsonl(repoRoot);
    expect(result.violations.join("\n")).toBe("");
    expect(result.ok).toBe(true);
  });
});
