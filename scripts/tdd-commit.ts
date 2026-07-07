// The tdd-commit helper (SPECIFICATION/non-functional-requirements.md
// §"Mechanically enforced Red -> Green commit protocol"): mechanizes the
// stage-anchor-test-alone -> commit -> stage-implementation -> amend
// sequence as a single invocation for Red -> Green work, plus a Suite-Green
// mode for refactors, chores, and passing test-only cleanups. All
// validation lives in the commit-msg hook; this helper only sequences git.
//
// Usage:
//   bun run tdd-commit red-green --anchor <test-path> --message "<subject>"
//   bun run tdd-commit suite-green --message "<subject>"
//
// Exit codes: 0 success, 1 a git step (usually the hook) rejected,
// 2 usage error.

import { existsSync } from "node:fs";
import { join } from "node:path";

import { git } from "./tdd-protocol";

function usage(): never {
  console.error(
    'usage: bun run tdd-commit red-green --anchor <test-path> --message "<subject>"\n' +
      '       bun run tdd-commit suite-green --message "<subject>"',
  );
  process.exit(2);
}

function flagValue(argv: readonly string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return argv[index + 1];
}

const argv = process.argv.slice(2);
const mode = argv[0];
const message = flagValue(argv, "--message") ?? flagValue(argv, "-m");
if (message === undefined) {
  usage();
}

const rootRes = git(process.cwd(), "rev-parse", "--show-toplevel");
if (rootRes.exitCode !== 0) {
  console.error("tdd-commit: precondition failure — not a git repository");
  process.exit(3);
}
const root = rootRes.output.trim();

function step(label: string, ...args: readonly string[]): void {
  const res = git(root, ...args);
  if (res.exitCode !== 0) {
    console.error(`tdd-commit: ${label} failed:\n${res.output}`);
    process.exit(1);
  }
}

if (mode === "red-green") {
  const anchor = flagValue(argv, "--anchor");
  if (anchor === undefined) {
    usage();
  }
  if (!existsSync(join(root, anchor))) {
    console.error(`tdd-commit: anchor test not found: ${anchor}`);
    process.exit(2);
  }
  // Red: the anchor is staged ALONE and committed; the hook validates the
  // failing-assertion Red moment and records the TDD-Red-* trailers.
  step("unstage", "reset", "-q");
  step("stage anchor", "add", anchor);
  step("Red commit", "commit", "-m", message);
  // Green: stage the implementation and supporting files, then amend; the
  // hook re-verifies the anchor checksum, re-runs it, and records the
  // TDD-Green-* trailers on the single durable commit.
  step("stage implementation", "add", "-A");
  step("Green amend", "commit", "--amend", "--no-edit");
  console.log("tdd-commit: Red -> Green complete (single durable commit)");
  process.exit(0);
}

if (mode === "suite-green") {
  step("stage changes", "add", "-A");
  step("Suite-Green commit", "commit", "-m", message);
  console.log("tdd-commit: Suite-Green complete");
  process.exit(0);
}

usage();
