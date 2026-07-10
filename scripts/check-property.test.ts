// Harness test for the property/fuzz reproducibility gate.
//
// Pins SPECIFICATION/non-functional-requirements.md §"Fuzzing and property
// checks": property and fuzz tests must be reproducible, and the aggregate
// check must fail when the required reproducibility metadata is absent. The
// metadata lives in property.config.json — a fast-check (or documented
// stricter equivalent) runner, a fixed or logged seed, declared fast and CI
// minimum run counts, a replay command, shrunk-counterexample capture, and
// the valid/malformed/adversarial/boundary/legacy generator classes. With
// no src/** property targets yet the gate is armed-but-vacuous and still
// enforces the committed reproducibility policy.

import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const propertyScript = join(repoRoot, "scripts", "check-property.ts");

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function validConfig(): Record<string, unknown> {
  return {
    runner: "fast-check",
    seed: 4242,
    runCounts: { fast: 100, ci: 1000 },
    replayCommand: "bun run test:property -- --seed <seed>",
    captureShrunkCounterexamples: true,
    generatorClasses: [
      "valid-domain",
      "malformed",
      "adversarial",
      "boundary",
      "legacy-compatibility",
    ],
    phase1Targets: [
      "governed-yaml-parse-reject",
      "item-and-section-slug-derivation",
      "markdown-and-html-strip-for-search",
      "date-parse-render-sort",
      "search-filter-sort-composition",
      "domainerror-presentation-mapping",
    ],
  };
}

function makeFixture(config: Record<string, unknown> | null): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-property-fixture-"));
  fixtures.push(dir);
  if (config !== null) {
    writeFileSync(
      join(dir, "property.config.json"),
      JSON.stringify(config, null, 2),
    );
  }
  return dir;
}

function runProperty(root: string): {
  exitCode: number | null;
  output: string;
} {
  const run = Bun.spawnSync({
    cmd: ["bun", propertyScript, "--project-root", root],
    cwd: repoRoot,
  });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

describe("property/fuzz reproducibility gate (li-m2trzv)", () => {
  test("the repository passes with the gate armed (no src/** targets yet)", () => {
    const { exitCode, output } = runProperty(repoRoot);
    expect(output).toContain("armed");
    expect(exitCode).toBe(0);
  }, 60000);

  test("a well-formed reproducibility config passes", () => {
    const { exitCode, output } = runProperty(makeFixture(validConfig()));
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test('a seed of "logged" is accepted', () => {
    const config = validConfig();
    config["seed"] = "logged";
    const { exitCode } = runProperty(makeFixture(config));
    expect(exitCode).toBe(0);
  }, 60000);

  test("a missing config fails", () => {
    const { exitCode, output } = runProperty(makeFixture(null));
    expect(exitCode).toBe(1);
    expect(output).toContain("property.config.json");
    expect(output).toContain("missing");
  }, 60000);

  test("a missing generator class fails", () => {
    const config = validConfig();
    config["generatorClasses"] = ["valid-domain", "boundary"];
    const { exitCode, output } = runProperty(makeFixture(config));
    expect(exitCode).toBe(1);
    expect(output).toContain("generatorClasses");
    expect(output).toContain("adversarial");
  }, 60000);

  test("an invalid seed fails", () => {
    const config = validConfig();
    config["seed"] = "whenever";
    const { exitCode, output } = runProperty(makeFixture(config));
    expect(exitCode).toBe(1);
    expect(output).toContain("seed");
  }, 60000);

  test("a CI run count below the fast run count fails", () => {
    const config = validConfig();
    config["runCounts"] = { fast: 500, ci: 100 };
    const { exitCode, output } = runProperty(makeFixture(config));
    expect(exitCode).toBe(1);
    expect(output).toContain("runCounts.ci");
  }, 60000);

  test("a missing replay command fails", () => {
    const config = validConfig();
    delete config["replayCommand"];
    const { exitCode, output } = runProperty(makeFixture(config));
    expect(exitCode).toBe(1);
    expect(output).toContain("replayCommand");
  }, 60000);

  test("shrink capture disabled fails", () => {
    const config = validConfig();
    config["captureShrunkCounterexamples"] = false;
    const { exitCode, output } = runProperty(makeFixture(config));
    expect(exitCode).toBe(1);
    expect(output).toContain("captureShrunkCounterexamples");
  }, 60000);

  test("a non-fast-check runner without a rationale fails, but passes with one", () => {
    const bare = validConfig();
    bare["runner"] = "custom-fuzzer";
    const failed = runProperty(makeFixture(bare));
    expect(failed.exitCode).toBe(1);
    expect(failed.output).toContain("runnerRationale");

    const justified = validConfig();
    justified["runner"] = "custom-fuzzer";
    justified["runnerRationale"] =
      "custom-fuzzer supersets fast-check's shrinking with coverage-guided generation";
    const passed = runProperty(makeFixture(justified));
    expect(passed.exitCode).toBe(0);
  }, 60000);

  test("a missing phase1Targets list fails", () => {
    const config = validConfig();
    delete config["phase1Targets"];
    const { exitCode, output } = runProperty(makeFixture(config));
    expect(exitCode).toBe(1);
    expect(output).toContain("phase1Targets");
  }, 60000);

  test("an incomplete phase1Targets list fails", () => {
    const config = validConfig();
    config["phase1Targets"] = ["governed-yaml-parse-reject"];
    const { exitCode, output } = runProperty(makeFixture(config));
    expect(exitCode).toBe(1);
    expect(output).toContain("phase1Targets");
    expect(output).toContain("date-parse-render-sort");
  }, 60000);

  test("the aggregate check runs the property gate as operational", () => {
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
      .find((line) => line.includes("property/fuzz reproducibility"));
    expect(gateLine).toBeDefined();
    expect(gateLine).toContain("[ok]");
    expect(run.exitCode).toBe(0);
  }, 240000);
});
