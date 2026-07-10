// Harness test for the primary-checkout commit-refuse gate
// (scripts/check-primary-checkout.ts), per
// SPECIFICATION/non-functional-requirements.md §"Hooks" and the enforcement
// scenario §"Commits in the primary checkout are refused". The gate refuses a
// commit whose git-dir equals its git-common-dir (a primary checkout) in the
// repository it governs, and allows a commit in a secondary worktree or in a
// foreign repository that merely borrows the hook via core.hooksPath (e.g. the
// throwaway `git init` fixtures in scripts/tdd-hook.test.ts). Exercised
// against real throwaway git repositories, following the Bun.spawnSync idiom
// in scripts/tdd-hook.test.ts / scripts/agent-hooks.test.ts.

import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { commitLocation, governsCheckout } from "./check-primary-checkout";

const repoRoot = join(import.meta.dir, "..");
const realScript = join(repoRoot, "scripts", "check-primary-checkout.ts");

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function git(
  cwd: string,
  ...args: readonly string[]
): { exitCode: number | null; output: string } {
  const run = Bun.spawnSync({ cmd: ["git", ...args], cwd });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

// A throwaway primary checkout with one commit — enough to add a worktree.
function makePrimary(): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-primary-fixture-"));
  fixtures.push(dir);
  git(dir, "init", "-q", "-b", "master");
  git(dir, "config", "user.email", "wt@example.invalid");
  git(dir, "config", "user.name", "WT Fixture");
  expect(
    git(dir, "commit", "-q", "--allow-empty", "-m", "chore: init").exitCode,
  ).toBe(0);
  return dir;
}

// Copies the real gate into the fixture's own scripts/ so the fixture IS the
// repository that copy governs; returns the copy's path.
function installOwnedScript(dir: string): string {
  mkdirSync(join(dir, "scripts"), { recursive: true });
  const owned = join(dir, "scripts", "check-primary-checkout.ts");
  cpSync(realScript, owned);
  return owned;
}

function addWorktree(dir: string, suffix: string): string {
  const wt = `${dir}-${suffix}`;
  fixtures.push(wt);
  // Detached so it does not collide with `master` already checked out in the
  // primary; the gate cares about worktree topology, not the ref.
  expect(git(dir, "worktree", "add", "-q", "--detach", wt).exitCode).toBe(0);
  return wt;
}

function runScript(
  script: string,
  cwd: string,
): { code: number | null; stderr: string } {
  const run = Bun.spawnSync({ cmd: ["bun", script], cwd });
  return { code: run.exitCode, stderr: run.stderr.toString() };
}

describe("commitLocation (pure topology)", () => {
  test("a primary checkout is refuse", () => {
    expect(commitLocation(makePrimary())).toBe("refuse");
  });

  test("a secondary worktree is allow", () => {
    const dir = makePrimary();
    const wt = addWorktree(dir, "wt");
    expect(commitLocation(wt)).toBe("allow");
  });

  test("a non-git directory is unknown", () => {
    const dir = mkdtempSync(join(tmpdir(), "resume-nongit-"));
    fixtures.push(dir);
    expect(commitLocation(dir)).toBe("unknown");
  });
});

describe("governsCheckout (ownership scoping)", () => {
  test("false when the scriptDir belongs to a different repository", () => {
    // The real repo's scriptDir does not govern a foreign fixture.
    expect(governsCheckout(makePrimary(), join(repoRoot, "scripts"))).toBe(
      false,
    );
  });

  test("true when the scriptDir belongs to the checkout's own repository", () => {
    const dir = makePrimary();
    expect(governsCheckout(dir, join(dir, "scripts"))).toBe(true);
  });
});

describe("commit-refuse CLI (ownership-scoped)", () => {
  test("allows a foreign primary checkout borrowing the hook (fixtures pass)", () => {
    // The real repo script, run against a foreign repo it does not govern,
    // must exit 0 — this is exactly the scripts/tdd-hook.test.ts situation.
    expect(runScript(realScript, makePrimary()).code).toBe(0);
  });

  test("refuses a primary checkout in the repository it governs", () => {
    const dir = makePrimary();
    const owned = installOwnedScript(dir);
    const { code, stderr } = runScript(owned, dir);
    expect(code).toBe(1);
    expect(stderr).toContain("git worktree add");
  });

  test("allows a secondary worktree in the repository it governs", () => {
    const dir = makePrimary();
    const owned = installOwnedScript(dir);
    const wt = addWorktree(dir, "owned-wt");
    expect(runScript(owned, wt).code).toBe(0);
  });
});
