// Primary-checkout commit-refuse gate per
// SPECIFICATION/non-functional-requirements.md §"Hooks" and §"Pull request
// landing automation" (worktree-mandatory since v028): a commit MUST be
// authored in a secondary git worktree, never in the primary checkout. This
// gate refuses a commit whose repository git-dir equals its git-common-dir —
// the signature of the primary checkout (a secondary worktree's git-dir is
// `.git/worktrees/<name>`, which differs from the common `.git`).
//
// STATUS: HELD / NOT YET INSTALLED. This script is committed but is
// intentionally NOT wired into `.githooks/pre-commit`, and `bun run check`
// does NOT yet require it, per the owner's directive to stage the enforcement
// without disrupting concurrent sessions sharing the primary checkout. This
// leaves a deliberate, documented gap against the v028 §"Hooks" requirement
// that the commit-refuse hook be installed and check-verified. To ACTIVATE:
//   1. Prepend `bun "$hook_dir/../scripts/check-primary-checkout.ts"` to
//      `.githooks/pre-commit` (before the memory guard's `exec`).
//   2. Add a check in scripts/check.ts that `.githooks/pre-commit` invokes
//      this script, so a bypassed/uninstalled hook is caught by `bun run check`.
//
// Exit codes per §"Exit-code baseline": 0 allowed (in a worktree, or not a git
// repo), 1 refused (commit in the primary checkout), 3 git precondition failure.

import { resolve } from "node:path";

function gitPath(cwd: string, args: string[]): string | null {
  const r = Bun.spawnSync({ cmd: ["git", ...args], cwd });
  if (r.exitCode !== 0) {
    return null;
  }
  return r.stdout.toString().trim();
}

// Returns "refuse" when cwd is the primary checkout, "allow" when a secondary
// worktree, or "unknown" when git state cannot be resolved.
export function commitLocation(cwd: string): "refuse" | "allow" | "unknown" {
  const gitDir = gitPath(cwd, ["rev-parse", "--absolute-git-dir"]);
  const commonDir = gitPath(cwd, [
    "rev-parse",
    "--path-format=absolute",
    "--git-common-dir",
  ]);
  if (gitDir === null || commonDir === null) {
    return "unknown";
  }
  return resolve(gitDir) === resolve(commonDir) ? "refuse" : "allow";
}

const REFUSE_MESSAGE =
  "commit refused: this is the PRIMARY checkout, but this repository is " +
  'worktree-mandatory (non-functional-requirements.md §"Pull request landing ' +
  'automation", v028). Author changes in a secondary worktree:\n' +
  '  git worktree add -b <branch> "$HOME/.worktrees/resume/<branch>" master\n' +
  "then commit there and land by a fast-forward push to master or the PR " +
  "auto-merge path.";

if (import.meta.main) {
  const cwd = process.cwd();
  const location = commitLocation(cwd);
  if (location === "unknown") {
    console.error(
      "precondition failure: could not resolve git worktree state.",
    );
    process.exit(3);
  }
  if (location === "refuse") {
    console.error(REFUSE_MESSAGE);
    process.exit(1);
  }
  process.exit(0);
}
