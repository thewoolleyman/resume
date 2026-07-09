// Harness test for the content-triggered Red -> Green TDD commit gate
// (work item li-avk7d7; plan/guardrail/research/findings.md slice 4).
//
// Pins SPECIFICATION/non-functional-requirements.md §"Mechanically enforced
// Red -> Green commit protocol": the commit-msg hook selects the Red, Green,
// or Suite-Green leg from the staged buckets (first-party product source vs
// test files) plus HEAD trailer state; a valid Red records checksummed
// TDD-Red-* trailers; the Green amend re-verifies the anchor byte-for-byte
// and re-runs it; product commits without a leg are rejected; and the
// origin/master..HEAD range validator catches commits laundered past the
// hook. Exercised end-to-end against throwaway fixture git repositories
// whose core.hooksPath points at this repository's committed .githooks/.

import { afterAll, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function sh(
  cwd: string,
  cmd: readonly string[],
): { exitCode: number | null; output: string } {
  const run = Bun.spawnSync({ cmd: [...cmd], cwd });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

function git(
  cwd: string,
  ...args: readonly string[]
): { exitCode: number | null; output: string } {
  return sh(cwd, ["git", ...args]);
}

function headMessage(dir: string): string {
  return git(dir, "log", "-1", "--format=%B").output;
}

// A fixture repository with one product file, one passing base test, and a
// test:harness script — enough for every leg of the protocol.
function makeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-tdd-fixture-"));
  fixtures.push(dir);
  git(dir, "init", "-q", "-b", "master");
  git(dir, "config", "user.email", "tdd@example.invalid");
  git(dir, "config", "user.name", "TDD Fixture");
  git(dir, "config", "core.hooksPath", join(repoRoot, ".githooks"));
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "fixture",
      private: true,
      type: "module",
      scripts: { "test:harness": "bun test tests" },
    }),
  );
  mkdirSync(join(dir, "tests"), { recursive: true });
  writeFileSync(
    join(dir, "tests", "base.test.ts"),
    'import { expect, test } from "bun:test";\n' +
      'test("base", () => {\n  expect(true).toBe(true);\n});\n',
  );
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(
    join(dir, "src", "foo.ts"),
    "export function foo(): number {\n  return 1;\n}\n",
  );
  git(dir, "add", "-A");
  const commit = git(dir, "commit", "-m", "chore: init fixture");
  expect(commit.exitCode).toBe(0);
  return dir;
}

// Stages the canonical failing anchor: tests/foo.test.ts expects foo() to be
// 2 while the committed implementation returns 1 — a real assertion failure,
// not an import error.
function stageFailingAnchor(dir: string): void {
  writeFileSync(
    join(dir, "tests", "foo.test.ts"),
    'import { expect, test } from "bun:test";\n' +
      'import { foo } from "../src/foo";\n' +
      'test("foo returns 2", () => {\n  expect(foo()).toBe(2);\n});\n',
  );
  git(dir, "add", "tests/foo.test.ts");
}

describe("content-triggered Red -> Green TDD commit gate (li-avk7d7)", () => {
  test("a commit staging neither bucket passes with no TDD trailers", () => {
    const dir = makeRepo();
    writeFileSync(join(dir, "README.md"), "# fixture\n");
    git(dir, "add", "README.md");
    const commit = git(dir, "commit", "-m", "docs: add readme");
    expect(commit.exitCode).toBe(0);
    expect(headMessage(dir)).not.toContain("TDD-");
  }, 240000);

  test("a failing anchor staged alone commits as Red with checksummed trailers", () => {
    const dir = makeRepo();
    stageFailingAnchor(dir);
    const commit = git(dir, "commit", "-m", "test: foo returns 2");
    expect(commit.exitCode).toBe(0);
    const message = headMessage(dir);
    expect(message).toContain("TDD-Red-Test: tests/foo.test.ts");
    expect(message).toContain("TDD-Red-Failure-Reason:");
    expect(message).toMatch(/TDD-Red-Test-File-Checksum: sha256:[0-9a-f]{64}/);
    expect(message).toMatch(/TDD-Red-Output-Checksum: sha256:[0-9a-f]{64}/);
    expect(message).toContain("TDD-Red-Captured-At:");
    expect(message).not.toContain("TDD-Green-Verified-At:");
  }, 240000);

  test("a passing test staged alone under a feat: subject is rejected", () => {
    const dir = makeRepo();
    writeFileSync(
      join(dir, "tests", "bar.test.ts"),
      'import { expect, test } from "bun:test";\n' +
        'test("bar", () => {\n  expect(1).toBe(1);\n});\n',
    );
    git(dir, "add", "tests/bar.test.ts");
    const commit = git(dir, "commit", "-m", "feat: bar behavior");
    expect(commit.exitCode).not.toBe(0);
  }, 240000);

  test("the Green amend re-verifies the anchor and records Green trailers on one commit", () => {
    const dir = makeRepo();
    stageFailingAnchor(dir);
    expect(git(dir, "commit", "-m", "feat: foo returns 2").exitCode).toBe(0);
    writeFileSync(
      join(dir, "src", "foo.ts"),
      "export function foo(): number {\n  return 2;\n}\n",
    );
    git(dir, "add", "src/foo.ts");
    const amend = git(dir, "commit", "--amend", "--no-edit");
    expect(amend.exitCode).toBe(0);
    const message = headMessage(dir);
    expect(message).toContain("TDD-Red-Test: tests/foo.test.ts");
    expect(message).toContain("TDD-Green-Verified-At:");
    expect(message).toContain("TDD-Green-Parent-Reflog:");
    const count = git(dir, "rev-list", "--count", "HEAD");
    expect(count.output.trim()).toBe("2");
  }, 240000);

  test("a Green amend whose anchor bytes changed is rejected", () => {
    const dir = makeRepo();
    stageFailingAnchor(dir);
    expect(git(dir, "commit", "-m", "feat: foo returns 2").exitCode).toBe(0);
    writeFileSync(
      join(dir, "src", "foo.ts"),
      "export function foo(): number {\n  return 2;\n}\n",
    );
    writeFileSync(
      join(dir, "tests", "foo.test.ts"),
      'import { expect, test } from "bun:test";\n' +
        'import { foo } from "../src/foo";\n' +
        "// tampered\n" +
        'test("foo returns 2", () => {\n  expect(foo()).toBe(2);\n});\n',
    );
    git(dir, "add", "src/foo.ts", "tests/foo.test.ts");
    const amend = git(dir, "commit", "--amend", "--no-edit");
    expect(amend.exitCode).not.toBe(0);
  }, 240000);

  test("a behavior-preserving product change takes the Suite-Green leg", () => {
    const dir = makeRepo();
    writeFileSync(
      join(dir, "src", "foo.ts"),
      "// tidy\nexport function foo(): number {\n  return 1;\n}\n",
    );
    git(dir, "add", "src/foo.ts");
    const commit = git(dir, "commit", "-m", "chore: tidy foo");
    expect(commit.exitCode).toBe(0);
    const message = headMessage(dir);
    expect(message).toContain("TDD-Suite-Green-Scope: full-suite");
    expect(message).toMatch(
      /TDD-Suite-Green-Output-Checksum: sha256:[0-9a-f]{64}/,
    );
    expect(message).toContain("TDD-Suite-Green-Captured-At:");
  }, 240000);

  test("a fresh product commit atop a Red-awaiting-Green HEAD is rejected", () => {
    const dir = makeRepo();
    stageFailingAnchor(dir);
    expect(git(dir, "commit", "-m", "feat: foo returns 2").exitCode).toBe(0);
    writeFileSync(
      join(dir, "src", "foo.ts"),
      "export function foo(): number {\n  return 2;\n}\n",
    );
    git(dir, "add", "src/foo.ts");
    const commit = git(dir, "commit", "-m", "feat: implement foo");
    expect(commit.exitCode).not.toBe(0);
  }, 240000);

  test("the branch-range validator fails a product commit laundered past the hook", () => {
    const dir = makeRepo();
    const base = git(dir, "rev-parse", "HEAD").output.trim();
    git(dir, "update-ref", "refs/remotes/origin/master", base);
    writeFileSync(
      join(dir, "src", "foo.ts"),
      "export function foo(): number {\n  return 3;\n}\n",
    );
    git(dir, "add", "src/foo.ts");
    expect(
      git(dir, "commit", "--no-verify", "-m", "feat: laundered").exitCode,
    ).toBe(0);
    const range = sh(dir, [
      "bun",
      join(repoRoot, "scripts", "tdd-range-check.ts"),
    ]);
    expect(range.exitCode).toBe(1);
    expect(range.output).toContain("laundered");
  }, 240000);

  test("the branch-range validator passes evidence-carrying commits and skips non-product ones", () => {
    const dir = makeRepo();
    const base = git(dir, "rev-parse", "HEAD").output.trim();
    git(dir, "update-ref", "refs/remotes/origin/master", base);
    writeFileSync(
      join(dir, "src", "foo.ts"),
      "// tidy\nexport function foo(): number {\n  return 1;\n}\n",
    );
    git(dir, "add", "src/foo.ts");
    expect(git(dir, "commit", "-m", "chore: tidy foo").exitCode).toBe(0);
    writeFileSync(join(dir, "README.md"), "# fixture\n");
    git(dir, "add", "README.md");
    expect(git(dir, "commit", "-m", "docs: readme").exitCode).toBe(0);
    const range = sh(dir, [
      "bun",
      join(repoRoot, "scripts", "tdd-range-check.ts"),
    ]);
    expect(range.exitCode).toBe(0);
  }, 240000);

  test("the tdd-commit helper mechanizes Red then Green as one invocation", () => {
    const dir = makeRepo();
    writeFileSync(
      join(dir, "src", "foo.ts"),
      "export function foo(): number {\n  return 2;\n}\n",
    );
    writeFileSync(
      join(dir, "tests", "foo.test.ts"),
      'import { expect, test } from "bun:test";\n' +
        'import { foo } from "../src/foo";\n' +
        'test("foo returns 2", () => {\n  expect(foo()).toBe(2);\n});\n',
    );
    const helper = sh(dir, [
      "bun",
      join(repoRoot, "scripts", "tdd-commit.ts"),
      "red-green",
      "--anchor",
      "tests/foo.test.ts",
      "--message",
      "feat: foo returns 2",
    ]);
    expect(helper.exitCode).toBe(0);
    const message = headMessage(dir);
    expect(message).toContain("TDD-Red-Test: tests/foo.test.ts");
    expect(message).toContain("TDD-Green-Verified-At:");
    const status = git(dir, "status", "--porcelain");
    expect(status.output.trim()).toBe("");
  }, 240000);
  test("the aggregate check runs the branch-range validation as an operational gate", () => {
    const run = Bun.spawnSync({
      cmd: [
        "bun",
        join(repoRoot, "scripts", "check.ts"),
        "--project-root",
        repoRoot,
      ],
      cwd: repoRoot,
      env: {
        ...process.env,
        CHECK_SKIP_HARNESS_TESTS: "1",
        CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
        CHECK_SKIP_BUILD: "1",
        CHECK_SKIP_E2E: "1",
        CHECK_SKIP_COVERAGE: "1",
      },
    });
    const output = run.stdout.toString() + run.stderr.toString();
    const gateLine = output
      .split("\n")
      .find((line) => line.includes("tdd branch-range validation"));
    expect(gateLine).toBeDefined();
    // Inside the hook's staged-tree checkout there is no .git, so the gate
    // reports itself as skipped; in the real repository it must be ok.
    if (existsSync(join(repoRoot, ".git"))) {
      expect(gateLine).toContain("[ok]");
    } else {
      expect(gateLine).toContain("skipped");
    }
    expect(run.exitCode).toBe(0);
  }, 240000);

  test("staging more than one failing test file is rejected (the anchor is singular)", () => {
    const dir = makeRepo();
    writeFileSync(
      join(dir, "tests", "a1.test.ts"),
      'import { expect, test } from "bun:test";\n' +
        'test("a1", () => {\n  expect(1).toBe(2);\n});\n',
    );
    writeFileSync(
      join(dir, "tests", "a2.test.ts"),
      'import { expect, test } from "bun:test";\n' +
        'test("a2", () => {\n  expect(1).toBe(2);\n});\n',
    );
    git(dir, "add", "tests/a1.test.ts", "tests/a2.test.ts");
    const commit = git(dir, "commit", "-m", "test: two anchors at once");
    expect(commit.exitCode).not.toBe(0);
  }, 240000);

  test("a Red whose failure is an import error is rejected as non-meaningful", () => {
    const dir = makeRepo();
    writeFileSync(
      join(dir, "tests", "broken.test.ts"),
      'import { expect, test } from "bun:test";\n' +
        'import { ghost } from "../src/missing-module";\n' +
        'test("ghost", () => {\n  expect(ghost).toBe(1);\n});\n',
    );
    git(dir, "add", "tests/broken.test.ts");
    const commit = git(dir, "commit", "-m", "test: broken import");
    expect(commit.exitCode).not.toBe(0);
  }, 240000);

  test("the Suite-Green leg rejects a zero-test full-suite run", () => {
    const dir = makeRepo();
    // Deleting the whole suite alongside a product change leaves the staged
    // tree with zero tests: the deletion selects no leg, but the product
    // change takes Suite-Green, whose full-suite run must reject zero tests.
    git(dir, "rm", "-q", "tests/base.test.ts");
    writeFileSync(
      join(dir, "src", "foo.ts"),
      "// tidy\nexport function foo(): number {\n  return 1;\n}\n",
    );
    git(dir, "add", "src/foo.ts");
    const commit = git(dir, "commit", "-m", "chore: tidy foo");
    expect(commit.exitCode).not.toBe(0);
  }, 240000);

  test("an unresolvable range base fails the range validator actionably", () => {
    const dir = makeRepo();
    const range = sh(dir, [
      "bun",
      join(repoRoot, "scripts", "tdd-range-check.ts"),
    ]);
    expect(range.exitCode).not.toBe(0);
    expect(range.output).toContain("origin/master");
  }, 240000);

  test("the tdd-commit helper provides a Suite-Green mode", () => {
    const dir = makeRepo();
    writeFileSync(
      join(dir, "src", "foo.ts"),
      "// tidy\nexport function foo(): number {\n  return 1;\n}\n",
    );
    const helper = sh(dir, [
      "bun",
      join(repoRoot, "scripts", "tdd-commit.ts"),
      "suite-green",
      "--message",
      "chore: tidy foo",
    ]);
    expect(helper.exitCode).toBe(0);
    const message = headMessage(dir);
    expect(message).toContain("TDD-Suite-Green-Scope: full-suite");
    const status = git(dir, "status", "--porcelain");
    expect(status.output.trim()).toBe("");
  }, 240000);
});
