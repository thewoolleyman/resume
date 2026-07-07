// Branch-range validation for the Red -> Green TDD protocol
// (SPECIFICATION/non-functional-requirements.md §"Mechanically enforced
// Red -> Green commit protocol"): every non-merge commit in
// origin/master..HEAD that touches first-party product source must carry
// either the full TDD-Red-*/TDD-Green-* pair shape or the full
// TDD-Suite-Green-* shape, so a rebase, squash, or --no-verify commit cannot
// launder product source past the per-commit hook. Run by `bun run check`.
//
// Exit codes: 0 pass, 1 violations found, 2 usage error, 3 precondition
// failure (not a git repository, or unresolvable range base).

import {
  CHECKSUM_PATTERN,
  git,
  GREEN_TRAILERS,
  hasAll,
  isProductSource,
  parseTrailers,
  RED_TRAILERS,
  SUITE_TRAILERS,
} from "./tdd-protocol";

const rootRes = git(process.cwd(), "rev-parse", "--show-toplevel");
if (rootRes.exitCode !== 0) {
  console.error("tdd-range-check: precondition failure — not a git repository");
  process.exit(3);
}
const root = rootRes.output.trim();

const base = git(root, "rev-parse", "--verify", "--quiet", "origin/master");
if (base.exitCode !== 0) {
  console.error(
    "tdd-range-check: precondition failure — the range base origin/master is " +
      "unresolvable. Fetch the remote (a shallow checkout must unshallow: " +
      "`git fetch --unshallow origin master`) so origin/master..HEAD can be " +
      "validated; this check must not silently pass.",
  );
  process.exit(3);
}

const revList = git(root, "rev-list", "--no-merges", "origin/master..HEAD");
const commits = revList.output
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0);

const violations: string[] = [];
for (const sha of commits) {
  const paths = git(
    root,
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    "--diff-filter=ACMR",
    sha,
  )
    .output.split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (!paths.some(isProductSource)) {
    continue;
  }
  const message = git(root, "log", "-1", "--format=%B", sha).output;
  const subject = message.split("\n")[0] ?? "";
  const trailers = parseTrailers(message);
  const checksumsValid = [
    "TDD-Red-Test-File-Checksum",
    "TDD-Red-Output-Checksum",
    "TDD-Suite-Green-Output-Checksum",
  ].every((key) => {
    const value = trailers.get(key);
    return value === undefined || CHECKSUM_PATTERN.test(value);
  });
  const redGreenShape =
    hasAll(trailers, RED_TRAILERS) && hasAll(trailers, GREEN_TRAILERS);
  const suiteShape =
    hasAll(trailers, SUITE_TRAILERS) &&
    trailers.get("TDD-Suite-Green-Scope") === "full-suite";
  if (!((redGreenShape || suiteShape) && checksumsValid)) {
    violations.push(
      `${sha.slice(0, 10)} "${subject}" touches first-party product source ` +
        "without valid TDD evidence (needs the full TDD-Red-*/TDD-Green-* " +
        "pair shape or the full TDD-Suite-Green-* shape with sha256 checksums)",
    );
  }
}

if (violations.length > 0) {
  console.error("tdd-range-check: FAILED for origin/master..HEAD:");
  for (const violation of violations) {
    console.error(`  ${violation}`);
  }
  process.exit(1);
}
console.log(
  `tdd-range-check: ok (${String(commits.length)} commits in origin/master..HEAD)`,
);
