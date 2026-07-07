// Harness test for the aggregate check skeleton (work item li-w6mvog;
// plan/guardrail/research/findings.md slice 2).
//
// Pins the contract from SPECIFICATION/non-functional-requirements.md
// §"Aggregate command": `bun run check` (scripts/check.ts) is the single
// non-mutating quality gate. At this slice it verifies the required
// package-script surface, runs the harness tests, fail-closes on toolchain
// or product-source artifacts whose gates are not yet provisioned, and
// reports not-yet-provisioned gate families with their work items.
// Exit codes per §"Exit-code baseline": 0 pass, 1 gate failure,
// 3 precondition failure.

import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const checkScript = join(repoRoot, "scripts", "check.ts");

const REQUIRED_SCRIPTS = [
  "check",
  "bootstrap",
  "dev",
  "build",
  "typecheck",
  "lint",
  "lint:fix",
  "format",
  "format:check",
  "test:unit",
  "test:integration",
  "test:e2e",
  "test:coverage",
  "test:property",
  "test:harness",
  "check:scenarios",
  "check:result",
  "check:memory",
  "tdd-commit",
] as const;

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

interface FixtureOptions {
  readonly omitScript?: string;
  readonly withProductSource?: boolean;
  readonly withFailingHarnessTest?: boolean;
  readonly withPassingHarnessTest?: boolean;
  readonly withoutPackageJson?: boolean;
  readonly devDependencies?: Record<string, string>;
}

function makeFixture(options: FixtureOptions = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-check-fixture-"));
  fixtures.push(dir);
  mkdirSync(join(dir, ".githooks"), { recursive: true });
  if (!options.withoutPackageJson) {
    let scripts: Record<string, string> = {};
    for (const name of REQUIRED_SCRIPTS) {
      scripts[name] = "true";
    }
    scripts["bootstrap"] = "bun install && bun scripts/install-hooks.ts";
    if (options.omitScript !== undefined) {
      scripts = Object.fromEntries(
        Object.entries(scripts).filter(([name]) => name !== options.omitScript),
      );
    }
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify(
        {
          name: "fixture",
          private: true,
          type: "module",
          engines: { bun: "1.3.6" },
          scripts,
          devDependencies: options.devDependencies ?? {},
        },
        null,
        2,
      ),
    );
  }
  if (options.withProductSource) {
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, "src", "index.ts"), "export const x = 1;\n");
  }
  if (options.withPassingHarnessTest || options.withFailingHarnessTest) {
    mkdirSync(join(dir, "scripts"), { recursive: true });
    const expected = options.withFailingHarnessTest ? "2" : "1";
    writeFileSync(
      join(dir, "scripts", "fixture.test.ts"),
      'import { expect, test } from "bun:test";\n' +
        `test("fixture", () => expect(1).toBe(${expected}));\n`,
    );
  }
  return dir;
}

function runCheck(
  projectRoot: string,
  env: Record<string, string> = {},
): { exitCode: number | null; output: string } {
  const run = Bun.spawnSync({
    cmd: ["bun", checkScript, "--project-root", projectRoot],
    cwd: repoRoot,
    env: { ...process.env, ...env },
  });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

describe("aggregate check skeleton (li-w6mvog)", () => {
  test("passes on the current repository tree", () => {
    // CHECK_SKIP_HARNESS_TESTS avoids infinite recursion: this test already
    // runs inside `bun test scripts`, which the harness-tests gate spawns.
    const { exitCode, output } = runCheck(repoRoot, {
      CHECK_SKIP_HARNESS_TESTS: "1",
      CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
    });
    expect(output).toContain("package-script surface");
    expect(exitCode).toBe(0);
  });

  test("reports not-yet-provisioned gate families with their work items", () => {
    const { output } = runCheck(repoRoot, {
      CHECK_SKIP_HARNESS_TESTS: "1",
      CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
    });
    expect(output).toContain("li-xjjeqo");
    expect(output).toContain("li-oaxjqm");
    // The memory guardrail and discipline inventory (li-6b6u6m) are
    // operational gates now, no longer pending families.
    expect(output).not.toContain("li-6b6u6m");
  });

  test("is non-mutating on the repository tree", () => {
    const before = Bun.spawnSync({
      cmd: ["git", "status", "--porcelain"],
      cwd: repoRoot,
    }).stdout.toString();
    runCheck(repoRoot, {
      CHECK_SKIP_HARNESS_TESTS: "1",
      CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
    });
    const after = Bun.spawnSync({
      cmd: ["git", "status", "--porcelain"],
      cwd: repoRoot,
    }).stdout.toString();
    expect(after).toBe(before);
  });

  test("fails when a required script is missing, naming it", () => {
    const { exitCode, output } = runCheck(
      makeFixture({ omitScript: "tdd-commit" }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("tdd-commit");
  });

  test("exits 3 when package.json is missing (precondition failure)", () => {
    const { exitCode } = runCheck(makeFixture({ withoutPackageJson: true }));
    expect(exitCode).toBe(3);
  });

  test("runs the harness tests and passes when they pass", () => {
    const { exitCode, output } = runCheck(
      makeFixture({ withPassingHarnessTest: true }),
    );
    expect(output).toContain("harness tests");
    expect(exitCode).toBe(0);
  });

  test("fails when a harness test fails", () => {
    const { exitCode } = runCheck(
      makeFixture({ withFailingHarnessTest: true }),
    );
    expect(exitCode).toBe(1);
  });

  test("rejects every non-exact dependency spec, including ranges that start with an exact version", () => {
    const { exitCode, output } = runCheck(
      makeFixture({
        devDependencies: {
          "bad-or-range": "1.2.3 || 2.0.0",
          "bad-hyphen-range": "1.2.3 - 2.0.0",
          "bad-caret": "^1.2.3",
          "bad-tilde": "~1.2.3",
          "bad-tag": "latest",
        },
      }),
    );
    expect(exitCode).toBe(1);
    for (const name of [
      "bad-or-range",
      "bad-hyphen-range",
      "bad-caret",
      "bad-tilde",
      "bad-tag",
    ]) {
      expect(output).toContain(name);
    }
  });

  test("accepts exact versions with prerelease or build metadata", () => {
    const { exitCode } = runCheck(
      makeFixture({
        devDependencies: {
          "ok-exact": "1.2.3",
          "ok-prerelease": "1.2.3-beta.1",
        },
      }),
    );
    expect(exitCode).toBe(0);
  });

  test("fail-closes on product source before the guardrails are complete", () => {
    const { exitCode, output } = runCheck(
      makeFixture({ withProductSource: true }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("product source");
  });
});
