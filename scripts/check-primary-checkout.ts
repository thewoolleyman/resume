// Primary-checkout commit-refuse gate per
// SPECIFICATION/non-functional-requirements.md §"Hooks" and §"Pull request
// landing automation" (worktree-mandatory): a commit MUST be
// authored in a secondary git worktree, never in the primary checkout. This
// gate refuses a commit whose repository git-dir equals its git-common-dir —
// the signature of the primary checkout (a secondary worktree's git-dir is
// `.git/worktrees/<name>`, which differs from the common `.git`).
//
// Wired into `.githooks/pre-commit` (before the memory guard) and verified by
// `bun run check` (the "primary-checkout commit-refuse hook" gate), so a
// bypassed or uninstalled hook is caught (§"Hooks": `bun run check` MUST fail
// when the commit-refuse hook is absent).
//
// The refusal is scoped to the repository this hook is committed to. The
// committed hooks are shared via `core.hooksPath` by throwaway test fixtures
// (scripts/tdd-hook.test.ts) that commit in `git init` primary checkouts; a
// foreign repository — one whose git-common-dir is NOT this script's own
// repository `.git` — is allowed so the fixture suite is not refused. A fresh
// clone of THIS repository at any path is still governed, because its own copy
// of the script resolves its own `.git`, so a real primary-checkout commit is
// refused there.
//
// Exit codes per §"Exit-code baseline": 0 allowed (a secondary worktree, a
// repository this hook does not govern, or not a git repo), 1 refused (commit
// in this repository's primary checkout), 3 git precondition failure.

import { resolve } from "node:path";

function gitPath(cwd: string, args: string[]): string | null {
  const r = Bun.spawnSync({ cmd: ["git", ...args], cwd });
  if (r.exitCode !== 0) {
    return null;
  }
  return r.stdout.toString().trim();
}

function gitCommonDir(cwd: string): string | null {
  return gitPath(cwd, [
    "rev-parse",
    "--path-format=absolute",
    "--git-common-dir",
  ]);
}

// Returns "refuse" when cwd is a primary checkout (its git-dir equals its
// git-common-dir), "allow" when a secondary worktree, or "unknown" when git
// state cannot be resolved.
export function commitLocation(cwd: string): "refuse" | "allow" | "unknown" {
  const gitDir = gitPath(cwd, ["rev-parse", "--absolute-git-dir"]);
  const commonDir = gitCommonDir(cwd);
  if (gitDir === null || commonDir === null) {
    return "unknown";
  }
  return resolve(gitDir) === resolve(commonDir) ? "refuse" : "allow";
}

// True when the checkout at cwd belongs to the repository this hook script is
// committed to — its git-common-dir is the `.git` of the script's own
// repository root. import.meta.dir is `<repoRoot>/scripts`, so the governed
// `.git` is its parent's `.git`. A foreign repository that borrows this hook
// via `core.hooksPath` resolves a different common-dir and is NOT governed.
export function governsCheckout(cwd: string, scriptDir: string): boolean {
  const commonDir = gitCommonDir(cwd);
  if (commonDir === null) {
    return false;
  }
  return resolve(commonDir) === resolve(scriptDir, "..", ".git");
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
  // A commit in a secondary worktree is always allowed. A primary-checkout
  // commit is refused only in the repository this hook governs, so a foreign
  // repository that borrows the hook via core.hooksPath is left alone.
  if (location === "refuse" && governsCheckout(cwd, import.meta.dir)) {
    console.error(REFUSE_MESSAGE);
    process.exit(1);
  }
  process.exit(0);
}
