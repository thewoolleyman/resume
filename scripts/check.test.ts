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
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const checkScript = join(repoRoot, "scripts", "check.ts");
const realScenariosSpec = readFileSync(
  join(repoRoot, "SPECIFICATION", "scenarios.md"),
  "utf8",
);
const realScenarioCoverage = readFileSync(
  join(repoRoot, "scenario-coverage.json"),
  "utf8",
);

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
  // Override specific package scripts (e.g. make `build` or `test:e2e` fail)
  // so the build/e2e aggregate gates can be exercised in isolation.
  readonly scriptOverrides?: Record<string, string>;
  // Write a svelte.config.js so the tree reads as "provisioned" for the
  // build/e2e gates without needing src/** (which would trip other gates).
  readonly withSvelteConfig?: boolean;
  // Drop the real scenarios spec + coverage mapping into the fixture so the
  // in-process scenario gate has something to verify. "broken" removes a
  // mapping so the gate must fail even though check:scenarios is a no-op.
  readonly scenarioMapping?: "valid" | "broken";
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
    scripts = { ...scripts, ...(options.scriptOverrides ?? {}) };
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
  if (options.withSvelteConfig) {
    writeFileSync(join(dir, "svelte.config.js"), "export default {};\n");
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
  if (options.scenarioMapping !== undefined) {
    mkdirSync(join(dir, "SPECIFICATION"), { recursive: true });
    writeFileSync(
      join(dir, "SPECIFICATION", "scenarios.md"),
      realScenariosSpec,
    );
    let coverage = realScenarioCoverage;
    if (options.scenarioMapping === "broken") {
      const parsed = JSON.parse(realScenarioCoverage) as {
        mappings: { scenario: string }[];
      };
      parsed.mappings = parsed.mappings.filter(
        (m) => m.scenario !== "Visitor opens the interactive resume",
      );
      coverage = JSON.stringify(parsed, null, 2);
    }
    writeFileSync(join(dir, "scenario-coverage.json"), coverage);
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
      CHECK_SKIP_BUILD: "1",
      CHECK_SKIP_E2E: "1",
      CHECK_SKIP_COVERAGE: "1",
    });
    expect(output).toContain("package-script surface");
    expect(exitCode).toBe(0);
  }, 240000);

  test("every guardrail gate family is operational, none pending", () => {
    const { output } = runCheck(repoRoot, {
      CHECK_SKIP_HARNESS_TESTS: "1",
      CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
      CHECK_SKIP_BUILD: "1",
      CHECK_SKIP_E2E: "1",
      CHECK_SKIP_COVERAGE: "1",
    });
    // The scenario coverage gate (li-hb77ad) was the last pending family; it
    // is operational now alongside the memory guardrail + discipline
    // inventory (li-6b6u6m), the CI workflow verification (li-xjjeqo), the
    // Result/ROP gate (li-oaxjqm), and the coverage + property/fuzz gates
    // (li-m2trzv). No pending gate families remain.
    expect(output).toContain("scenario coverage");
    expect(output).toContain(
      "not-yet-provisioned gate families: none — every guardrail gate is operational.",
    );
    for (const workItem of [
      "li-hb77ad",
      "li-6b6u6m",
      "li-xjjeqo",
      "li-oaxjqm",
      "li-m2trzv",
    ]) {
      expect(output).not.toContain(workItem);
    }
  }, 240000);

  test("is non-mutating on the repository tree", () => {
    const before = Bun.spawnSync({
      cmd: ["git", "status", "--porcelain"],
      cwd: repoRoot,
    }).stdout.toString();
    runCheck(repoRoot, {
      CHECK_SKIP_HARNESS_TESTS: "1",
      CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
      CHECK_SKIP_BUILD: "1",
      CHECK_SKIP_E2E: "1",
      CHECK_SKIP_COVERAGE: "1",
    });
    const after = Bun.spawnSync({
      cmd: ["git", "status", "--porcelain"],
      cwd: repoRoot,
    }).stdout.toString();
    expect(after).toBe(before);
  }, 240000);

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

  test("fail-closes on product source that lacks the required guardrail artifacts", () => {
    // The dedicated premature-product-source boundary guard was removed once
    // product work began (li-eg4w7j — the green precondition for product
    // work). Product source under src/** is now permitted, but the additive
    // fail-closed gates (discipline inventory, CI provisioning, scenario
    // mapping) still require their artifacts to be present: a bare src/**
    // tree that lacks them fails, naming the product source.
    const { exitCode, output } = runCheck(
      makeFixture({ withProductSource: true }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("product source");
  });

  test("runs the scenario gate in-process, not via the check:scenarios script", () => {
    // The fixture's check:scenarios script is a no-op ("true"); a valid
    // committed mapping must still make the aggregate scenario gate pass,
    // proving the aggregate verifies the mapping in-process.
    const { exitCode, output } = runCheck(
      makeFixture({ scenarioMapping: "valid" }),
      { CHECK_SKIP_HARNESS_TESTS: "1", CHECK_SKIP_TOOLCHAIN_RUNNERS: "1" },
    );
    const gateLine = output
      .split("\n")
      .find((line) => line.includes("scenario coverage"));
    expect(gateLine).toContain("[ok]");
    expect(exitCode).toBe(0);
  }, 120000);

  test("the scenario gate fails on a broken mapping even when check:scenarios is a no-op", () => {
    // Reproducer for the aggregate no-op-script bypass: check:scenarios is
    // "true", so if the aggregate trusted the script it would pass. A broken
    // mapping must fail because the aggregate verifies it in-process.
    const { exitCode, output } = runCheck(
      makeFixture({ scenarioMapping: "broken" }),
      { CHECK_SKIP_HARNESS_TESTS: "1", CHECK_SKIP_TOOLCHAIN_RUNNERS: "1" },
    );
    expect(exitCode).toBe(1);
    const gateLine = output
      .split("\n")
      .find((line) => line.includes("scenario coverage"));
    expect(gateLine).toContain("[FAIL]");
    expect(output).toContain("no mapping");
  }, 120000);

  test("runs and passes the build and e2e gates when their scripts succeed", () => {
    // With the named scripts succeeding (fixture default "true"), both the
    // production-build gate and the e2e gate must RUN (not skip) and report
    // [ok] — proving they exercise the real scripts, not just their presence.
    const { exitCode, output } = runCheck(
      makeFixture({ scenarioMapping: "valid" }),
      { CHECK_SKIP_HARNESS_TESTS: "1", CHECK_SKIP_TOOLCHAIN_RUNNERS: "1" },
    );
    const buildLine = output
      .split("\n")
      .find((line) => line.includes("production build (bun run build)"));
    const e2eLine = output
      .split("\n")
      .find((line) => line.includes("end-to-end tests (bun run test:e2e)"));
    expect(buildLine).toContain("[ok]");
    expect(e2eLine).toContain("[ok]");
    expect(exitCode).toBe(0);
  }, 120000);

  test("fails when the production build fails, naming the build gate", () => {
    // A red `bun run build` (SvelteKit + Vercel adapter) must fail the
    // aggregate check — the gate runs the real named script, not a presence
    // check. Reproducer for the build gate-bypass class.
    const { exitCode, output } = runCheck(
      makeFixture({ scriptOverrides: { build: "exit 1" } }),
      {
        CHECK_SKIP_HARNESS_TESTS: "1",
        CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
        CHECK_SKIP_E2E: "1",
      },
    );
    expect(exitCode).toBe(1);
    const buildLine = output
      .split("\n")
      .find((line) => line.includes("production build (bun run build)"));
    expect(buildLine).toContain("[FAIL]");
  }, 120000);

  test("fails when the e2e suite fails, naming the e2e gate", () => {
    // A red `bun run test:e2e` (Playwright top-of-pyramid) must fail the
    // aggregate check. Reproducer for the e2e gate-bypass class.
    const { exitCode, output } = runCheck(
      makeFixture({ scriptOverrides: { "test:e2e": "exit 1" } }),
      {
        CHECK_SKIP_HARNESS_TESTS: "1",
        CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
        CHECK_SKIP_BUILD: "1",
      },
    );
    expect(exitCode).toBe(1);
    const e2eLine = output
      .split("\n")
      .find((line) => line.includes("end-to-end tests (bun run test:e2e)"));
    expect(e2eLine).toContain("[FAIL]");
  }, 120000);

  test("fail-closes a stubbed build in a provisioned tree (not [skipped])", () => {
    // Regression guard: reverting `build` to a not-yet-provisioned stub while
    // SvelteKit artifacts exist must FAIL the build gate, never launder it as
    // a pre-scaffold [skipped].
    const { exitCode, output } = runCheck(
      makeFixture({
        withSvelteConfig: true,
        scriptOverrides: { build: "bun scripts/not-yet-provisioned.ts build" },
      }),
      {
        CHECK_SKIP_HARNESS_TESTS: "1",
        CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
        CHECK_SKIP_E2E: "1",
      },
    );
    expect(exitCode).toBe(1);
    const buildLine = output
      .split("\n")
      .find((line) => line.includes("production build (bun run build)"));
    expect(buildLine).toContain("[FAIL]");
    expect(buildLine).not.toContain("[skipped]");
  }, 120000);

  test("fail-closes a stubbed test:e2e in a provisioned tree (not [skipped])", () => {
    const { exitCode, output } = runCheck(
      makeFixture({
        withSvelteConfig: true,
        scriptOverrides: {
          "test:e2e": "bun scripts/not-yet-provisioned.ts test:e2e",
        },
      }),
      {
        CHECK_SKIP_HARNESS_TESTS: "1",
        CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
        CHECK_SKIP_BUILD: "1",
      },
    );
    expect(exitCode).toBe(1);
    const e2eLine = output
      .split("\n")
      .find((line) => line.includes("end-to-end tests (bun run test:e2e)"));
    expect(e2eLine).toContain("[FAIL]");
    expect(e2eLine).not.toContain("[skipped]");
  }, 120000);

  test("a bare fixture's scenario gate is skipped, never a laundered [ok]", () => {
    // The watcher's reproducer: no scenario-coverage.json and no scenarios
    // spec, with check:scenarios a no-op. The gate must not report [ok] — a
    // tree with no scenarios spec at all is unprovisioned (skipped); the real
    // repo always carries the spec, so a deleted mapping there fails instead.
    const { output } = runCheck(makeFixture(), {
      CHECK_SKIP_HARNESS_TESTS: "1",
      CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
      CHECK_SKIP_BUILD: "1",
      CHECK_SKIP_E2E: "1",
      CHECK_SKIP_COVERAGE: "1",
    });
    const gateLine = output
      .split("\n")
      .find((line) => line.includes("scenario coverage"));
    expect(gateLine).toContain("[skipped]");
    expect(gateLine).not.toContain("[ok]");
  }, 120000);
});
