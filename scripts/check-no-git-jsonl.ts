// No-live-git-jsonl gate (plan/orchestrator-migration slice 4): after the
// work-item orchestrator was migrated from livespec-orchestrator-git-jsonl to
// livespec-orchestrator-beads-fabro, NO live reference to the retired git-jsonl
// orchestrator may remain in the tracked tree. Run as part of `bun run check`
// (in-process) and standalone as `bun scripts/check-no-git-jsonl.ts`.
//
// Scope — what is NOT a live reference (and is excluded):
// - SPECIFICATION/history/** — immutable ratified-spec snapshots.
// - archive/** — the archived JSONL work-items store AND archived plan threads,
//   including archive/orchestrator-migration/ (the migration thread itself,
//   which documents the git-jsonl -> beads-fabro migration and was archived on
//   completion — migration history, not a live orchestrator reference).
// - .beads/** — the migrated beads tenant pointer/data.
// - this gate, its test, and scripts/check.ts (which imports + wires it) —
//   they carry the search term ONLY as the machinery that ENFORCES no-git-jsonl
//   (a module named for what it forbids), never as a live orchestrator surface.
//
// Everything else in the tracked tree — config, gates, root docs, and every
// OTHER plan thread (mvp, guardrail, adversarial-spec-hardening) — is a live
// surface and MUST NOT reference git-jsonl. The scan is tracked-files-only
// (git grep), so gitignored/untracked scratch never trips it.
//
// Exit codes per §"Exit-code baseline": 0 clean, 1 live references found,
// 3 precondition failure (git unavailable / not a repo).

import { resolve } from "node:path";

// git grep pathspec exclusions. `:(exclude)` drops matching tracked paths.
const EXCLUDE_PATHSPECS = [
  ":(exclude)SPECIFICATION/history/**",
  ":(exclude)archive/**",
  ":(exclude).beads/**",
  ":(exclude)scripts/check.ts",
  ":(exclude)scripts/check-no-git-jsonl.ts",
  ":(exclude)scripts/check-no-git-jsonl.test.ts",
] as const;

export interface NoGitJsonlResult {
  readonly ok: boolean;
  readonly violations: readonly string[];
}

// Returns every `path:line: text` in the tracked tree (outside the documented
// exclusions) that mentions the retired git-jsonl orchestrator. Throws on a git
// failure so the CLI can map it to the exit-3 precondition path.
export function findGitJsonlReferences(root: string): string[] {
  const run = Bun.spawnSync({
    cmd: [
      "git",
      "grep",
      "-nIE",
      "git-jsonl|git_jsonl",
      "--",
      ...EXCLUDE_PATHSPECS,
    ],
    cwd: root,
  });
  const stdout = run.stdout.toString();
  const stderr = run.stderr.toString();
  // git grep: exit 0 = matches, 1 = no matches, >1 = error.
  if (run.exitCode === 0) {
    return stdout.split("\n").filter((line) => line.length > 0);
  }
  if (run.exitCode === 1) {
    return [];
  }
  throw new Error(
    `git grep failed (exit ${String(run.exitCode)}): ${stderr.trim()}`,
  );
}

export function checkNoGitJsonl(root: string): NoGitJsonlResult {
  const violations = findGitJsonlReferences(root);
  return { ok: violations.length === 0, violations };
}

function parseProjectRoot(argv: readonly string[]): string {
  const index = argv.indexOf("--project-root");
  if (index === -1) {
    return process.cwd();
  }
  const value = argv[index + 1];
  if (value === undefined) {
    console.error(
      "usage: bun scripts/check-no-git-jsonl.ts [--project-root <path>]",
    );
    process.exit(2);
  }
  return resolve(value);
}

if (import.meta.main) {
  const root = parseProjectRoot(process.argv.slice(2));
  let result: NoGitJsonlResult;
  try {
    result = checkNoGitJsonl(root);
  } catch (error) {
    console.error(`precondition failure: ${(error as Error).message}`);
    process.exit(3);
  }
  if (!result.ok) {
    console.error(
      `no-git-jsonl: REJECTED — ${String(result.violations.length)} live git-jsonl reference(s):`,
    );
    for (const violation of result.violations) {
      console.error(`  ${violation}`);
    }
    console.error(
      "The work-item orchestrator is livespec-orchestrator-beads-fabro; remove or " +
        "rephrase these references. Excluded (migration history, not live): " +
        "SPECIFICATION/history/, archive/, .beads/, plan/orchestrator-migration/.",
    );
    process.exit(1);
  }
  console.log(
    "no-git-jsonl: clean (no live git-jsonl reference in the tracked tree outside the documented exclusions).",
  );
}
