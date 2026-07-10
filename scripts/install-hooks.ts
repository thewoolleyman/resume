// Installs the committed git hooks by pointing core.hooksPath at the
// committed .githooks/ directory. Run by `bun run bootstrap` per
// SPECIFICATION/non-functional-requirements.md §"Package script categories"
// (Bootstrap: "Install pinned dependencies and local hooks") and §"Hooks"
// ("Hooks MUST be reproducible from committed configuration").
//
// Exit codes follow §"Exit-code baseline": 0 success, 1 unexpected git
// failure, 3 precondition failure (missing .githooks or not a git repo).

import { existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const hooksDir = join(repoRoot, ".githooks");

if (!existsSync(hooksDir)) {
  console.error(
    "precondition failure: committed hooks directory .githooks/ is missing.",
  );
  process.exit(3);
}

if (!existsSync(join(repoRoot, ".git"))) {
  console.error("precondition failure: not a git repository.");
  process.exit(3);
}

const configure = Bun.spawnSync({
  cmd: ["git", "config", "core.hooksPath", ".githooks"],
  cwd: repoRoot,
});
if (configure.exitCode !== 0) {
  console.error(
    `unexpected git failure setting core.hooksPath: ${configure.stderr.toString()}`,
  );
  process.exit(1);
}

const verify = Bun.spawnSync({
  cmd: ["git", "config", "--get", "core.hooksPath"],
  cwd: repoRoot,
});
if (verify.exitCode !== 0 || verify.stdout.toString().trim() !== ".githooks") {
  console.error("unexpected git failure: core.hooksPath did not verify.");
  process.exit(1);
}

console.log(
  "committed hooks installed: core.hooksPath -> .githooks " +
    "(hook files land additively per plan/archive/guardrail/research/findings.md).",
);
