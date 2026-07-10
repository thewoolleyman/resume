// The content-triggered Red -> Green commit-msg gate
// (SPECIFICATION/non-functional-requirements.md §"Mechanically enforced
// Red -> Green commit protocol"). Installed via .githooks/commit-msg by
// `bun run bootstrap`. Which leg applies is determined by the staged buckets
// (first-party product source vs test files) together with HEAD trailer
// state — never by an intent marker or the subject prefix. Bypass with
// git commit --no-verify is caught later by the branch-range validation in
// `bun run check`.
//
// Exit codes: 0 accept, 1 reject, 2 usage error.

import { readFileSync, rmSync, writeFileSync } from "node:fs";

import {
  anchorRunnerCommand,
  checkoutStagedTree,
  git,
  gitShowBytes,
  isMeaninglessFailure,
  isProductSource,
  isTestFile,
  parseTrailers,
  runFullSuite,
  runInCheckout,
  sha256,
  stagedPaths,
  utcNow,
} from "./tdd-protocol";

function reject(reason: string): never {
  console.error(`tdd-commit-msg gate: REJECTED — ${reason}`);
  process.exit(1);
}

function appendTrailers(
  msgFile: string,
  trailers: readonly [string, string][],
): void {
  let content = readFileSync(msgFile, "utf8").replace(/\s+$/, "");
  const lines = content.split("\n");
  const lastLine = lines[lines.length - 1] ?? "";
  // Keep every TDD trailer in one final paragraph so git treats them as
  // trailers: extend an existing block, otherwise open a new paragraph.
  content += /^TDD-[A-Za-z-]+:/.test(lastLine) ? "\n" : "\n\n";
  content += trailers.map(([key, value]) => `${key}: ${value}`).join("\n");
  writeFileSync(msgFile, `${content}\n`);
}

function runAnchorInStagedTree(
  root: string,
  anchorPath: string,
): { exitCode: number | null; output: string } {
  const staged = checkoutStagedTree(root);
  try {
    return runInCheckout(staged, anchorRunnerCommand(root, anchorPath));
  } finally {
    rmSync(staged, { recursive: true, force: true });
  }
}

function suiteGreenLeg(root: string, msgFile: string): void {
  const staged = checkoutStagedTree(root);
  try {
    const suite = runFullSuite(staged);
    if (!suite.ok) {
      reject(
        `the Suite-Green leg requires the FULL suite to pass against the staged tree — ${suite.failureDetail}`,
      );
    }
    appendTrailers(msgFile, [
      ["TDD-Suite-Green-Scope", "full-suite"],
      ["TDD-Suite-Green-Output-Checksum", sha256(suite.output)],
      ["TDD-Suite-Green-Captured-At", utcNow()],
    ]);
  } finally {
    rmSync(staged, { recursive: true, force: true });
  }
}

function greenLeg(
  root: string,
  msgFile: string,
  message: string,
  headSha: string,
): void {
  const trailers = parseTrailers(message);
  const anchor = trailers.get("TDD-Red-Test");
  const recorded = trailers.get("TDD-Red-Test-File-Checksum");
  if (anchor === undefined || recorded === undefined) {
    reject(
      "Green leg is missing the recorded TDD-Red-Test / TDD-Red-Test-File-Checksum trailers",
    );
  }
  const stagedBytes = gitShowBytes(root, anchor);
  if (stagedBytes === null) {
    reject(
      `the recorded anchor test ${anchor} is not present in the staged tree`,
    );
  }
  if (sha256(stagedBytes) !== recorded) {
    reject(
      `the anchor test ${anchor} changed since the Red commit (checksum mismatch) — changing the anchor requires authoring a new Red commit`,
    );
  }
  const result = runAnchorInStagedTree(root, anchor);
  if (result.exitCode !== 0) {
    const tail = result.output.trim().split("\n").slice(-3).join(" | ");
    reject(
      `the Green leg requires the anchor test ${anchor} to pass against the staged tree: ${tail}`,
    );
  }
  appendTrailers(msgFile, [
    ["TDD-Green-Verified-At", utcNow()],
    ["TDD-Green-Parent-Reflog", headSha],
  ]);
}

function redLeg(root: string, msgFile: string, anchorPath: string): void {
  const stagedBytes = gitShowBytes(root, anchorPath);
  if (stagedBytes === null) {
    reject(`cannot read the staged anchor test ${anchorPath}`);
  }
  const result = runAnchorInStagedTree(root, anchorPath);
  if (isMeaninglessFailure(result.output)) {
    reject(
      `the Red failure must be a real assertion failure, not an import or collection error — commit the anchor's supporting infrastructure first. Output tail: ${result.output.trim().split("\n").slice(-3).join(" | ")}`,
    );
  }
  const failureLine =
    result.output
      .split("\n")
      .find((line) => /error:|\(fail\)/i.test(line))
      ?.trim()
      .slice(0, 200) ?? "assertion failure (see output checksum)";
  appendTrailers(msgFile, [
    ["TDD-Red-Test", anchorPath],
    ["TDD-Red-Failure-Reason", failureLine],
    ["TDD-Red-Test-File-Checksum", sha256(stagedBytes)],
    ["TDD-Red-Output-Checksum", sha256(result.output)],
    ["TDD-Red-Captured-At", utcNow()],
  ]);
}

const msgFile = process.argv[2];
if (msgFile === undefined) {
  console.error("usage: bun scripts/tdd-commit-msg-hook.ts <commit-msg-file>");
  process.exit(2);
}

const rootRes = git(process.cwd(), "rev-parse", "--show-toplevel");
if (rootRes.exitCode !== 0) {
  console.error("tdd-commit-msg gate: not inside a git repository");
  process.exit(2);
}
const root = rootRes.output.trim();

const staged = stagedPaths(root);
const testFiles = staged.filter(isTestFile);
const productFiles = staged.filter(isProductSource);

// Neither bucket staged: documentation, configuration, spec-only,
// governed-data, generated-artifact, and empty commits pass immediately
// under any subject and record no trailers.
if (productFiles.length === 0 && testFiles.length === 0) {
  process.exit(0);
}

const message = readFileSync(msgFile, "utf8");
const subject =
  message
    .split("\n")
    .find((line) => line.trim().length > 0 && !line.startsWith("#")) ?? "";
const declaresBehavior = /^(feat|fix)(\(.*\))?!?:/.test(subject.trim());

const headExists = git(root, "rev-parse", "--verify", "HEAD").exitCode === 0;
const headMessage = headExists
  ? git(root, "log", "-1", "--format=%B").output
  : "";
const headTrailers = parseTrailers(headMessage);
const redAwaitingGreen =
  headTrailers.has("TDD-Red-Test") &&
  !headTrailers.has("TDD-Green-Verified-At");

if (productFiles.length > 0) {
  if (redAwaitingGreen) {
    if (!parseTrailers(message).has("TDD-Red-Test")) {
      reject(
        "HEAD is a Red commit awaiting its Green — stage the implementation and amend it (git commit --amend or bun run tdd-commit) instead of creating a fresh commit",
      );
    }
    const headSha = git(root, "rev-parse", "HEAD").output.trim();
    greenLeg(root, msgFile, message, headSha);
    process.exit(0);
  }
  suiteGreenLeg(root, msgFile);
  process.exit(0);
}

// Tests-only staging.
if (testFiles.length === 1) {
  const anchor = testFiles[0] as string;
  const result = runAnchorInStagedTree(root, anchor);
  if (result.exitCode !== 0) {
    redLeg(root, msgFile, anchor);
    process.exit(0);
  }
  if (declaresBehavior) {
    reject(
      `a ${subject.trim().split(":")[0] ?? "behavior-declaring"}: subject that stages a passing test alone is rejected — a declared behavior change must have a failing Red test first`,
    );
  }
  suiteGreenLeg(root, msgFile);
  process.exit(0);
}

// Multiple test files staged: never a valid Red moment (the anchor checksum
// is singular). A passing cleanup falls through to Suite-Green.
if (declaresBehavior) {
  reject(
    "a Red commit stages exactly ONE failing anchor test alone — stage a single anchor for a declared behavior change",
  );
}
suiteGreenLeg(root, msgFile);
process.exit(0);
