// Harness test for the coverage gate.
//
// Pins SPECIFICATION/non-functional-requirements.md §"Test coverage
// expectations": the committed coverage thresholds (coverage.config.json)
// must be 100% line and 100% branch for first-party src/**, `bun run check`
// fails when they drop below 100%, and every first-party src/** file in a
// present coverage report must be at 100% line and 100% branch. Generated
// artifacts and repository harness/tooling are outside the product-source
// set. With no report and no src/** the gate is armed-but-vacuous and still
// enforces the committed threshold floor.

import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const coverageScript = join(repoRoot, "scripts", "check-coverage.ts");

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

const FULL_THRESHOLDS = JSON.stringify({
  lines: 100,
  branches: 100,
  functions: 100,
  statements: 100,
});

function makeFixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-coverage-fixture-"));
  fixtures.push(dir);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, dirname(path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

function runCoverage(root: string): {
  exitCode: number | null;
  output: string;
} {
  const run = Bun.spawnSync({
    cmd: ["bun", coverageScript, "--project-root", root],
    cwd: repoRoot,
  });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

// A per-file coverage-summary entry in the Istanbul json-summary shape.
function fileEntry(linesPct: number, branchesPct: number): unknown {
  return {
    lines: { pct: linesPct },
    branches: { pct: branchesPct },
    functions: { pct: 100 },
    statements: { pct: 100 },
  };
}

describe("coverage gate (li-m2trzv)", () => {
  // Note: there is intentionally no direct runCoverage(repoRoot) "the
  // repository passes" smoke test. Once first-party src/** exists, the gate
  // fail-closes on a report-less tree (coverage must be PROVEN — see the "NO
  // coverage report fails" fixture below), and a clean checkout has no
  // generated coverage/ report when this suite runs. The real repository's
  // coverage passing is proven by "the aggregate check runs the coverage gate
  // as operational" (which runs the real vitest --coverage + enforcement);
  // the armed (no-src) and active (report-present) branches are pinned by the
  // fixtures below.
  test("a config pinned at 100% line/branch passes", () => {
    const dir = makeFixture({ "coverage.config.json": FULL_THRESHOLDS });
    const { exitCode, output } = runCoverage(dir);
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("a threshold below 100% fails", () => {
    const dir = makeFixture({
      "coverage.config.json": JSON.stringify({
        lines: 90,
        branches: 100,
        functions: 100,
        statements: 100,
      }),
    });
    const { exitCode, output } = runCoverage(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("lines");
    expect(output).toContain("100%");
  }, 60000);

  test("a branch threshold below 100% fails", () => {
    const dir = makeFixture({
      "coverage.config.json": JSON.stringify({
        lines: 100,
        branches: 95,
        functions: 100,
        statements: 100,
      }),
    });
    const { exitCode, output } = runCoverage(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("branches");
  }, 60000);

  test("a missing threshold config fails", () => {
    const dir = makeFixture({ "README.md": "no config here\n" });
    const { exitCode, output } = runCoverage(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("coverage.config.json");
    expect(output).toContain("missing");
  }, 60000);

  test("a coverage report with an under-covered src/** file fails", () => {
    const dir = makeFixture({
      "coverage.config.json": FULL_THRESHOLDS,
      "coverage/coverage-summary.json": JSON.stringify({
        total: fileEntry(90, 90),
        "src/domain/parse.ts": fileEntry(80, 100),
      }),
    });
    const { exitCode, output } = runCoverage(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/domain/parse.ts");
    expect(output).toContain("lines");
  }, 60000);

  test("a coverage report with every src/** file at 100% passes", () => {
    const dir = makeFixture({
      "coverage.config.json": FULL_THRESHOLDS,
      "coverage/coverage-summary.json": JSON.stringify({
        total: fileEntry(100, 100),
        "src/domain/parse.ts": fileEntry(100, 100),
        "src/search/index.ts": fileEntry(100, 100),
      }),
    });
    const { exitCode, output } = runCoverage(dir);
    expect(output).not.toContain("FAIL");
    expect(output).toContain("2 first-party");
    expect(exitCode).toBe(0);
  }, 60000);

  test("an under-covered NON-src file in the report is ignored (harness/tooling is outside the set)", () => {
    const dir = makeFixture({
      "coverage.config.json": FULL_THRESHOLDS,
      "coverage/coverage-summary.json": JSON.stringify({
        total: fileEntry(50, 50),
        "scripts/check.ts": fileEntry(10, 10),
      }),
    });
    const { exitCode, output } = runCoverage(dir);
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("first-party src/** source present with NO coverage report fails (coverage unproven)", () => {
    const dir = makeFixture({
      "coverage.config.json": FULL_THRESHOLDS,
      "src/domain/parse.ts": "export const x = 1;\n",
    });
    const { exitCode, output } = runCoverage(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("no coverage report");
    expect(output).toContain("src/**");
  }, 60000);

  test("first-party src/** source present but omitted from the report fails", () => {
    const dir = makeFixture({
      "coverage.config.json": FULL_THRESHOLDS,
      "src/domain/parse.ts": "export const x = 1;\n",
      "coverage/coverage-summary.json": JSON.stringify({
        total: fileEntry(100, 100),
      }),
    });
    const { exitCode, output } = runCoverage(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/domain/parse.ts");
    expect(output).toContain("not present in the coverage report");
  }, 60000);

  test("first-party src/** source measured at 100% in the report passes", () => {
    const dir = makeFixture({
      "coverage.config.json": FULL_THRESHOLDS,
      "src/domain/parse.ts": "export const x = 1;\n",
      "coverage/coverage-summary.json": JSON.stringify({
        total: fileEntry(100, 100),
        "src/domain/parse.ts": fileEntry(100, 100),
      }),
    });
    const { exitCode, output } = runCoverage(dir);
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("the aggregate check runs the coverage gate as operational", () => {
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
      },
    });
    const output = run.stdout.toString() + run.stderr.toString();
    const gateLine = output
      .split("\n")
      .find((line) => line.includes("coverage thresholds"));
    expect(gateLine).toBeDefined();
    expect(gateLine).toContain("[ok]");
    expect(run.exitCode).toBe(0);
  }, 240000);
});
