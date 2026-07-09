// Harness test for the scenario coverage gate (work item li-hb77ad;
// plan/guardrail/research/findings.md slice 9).
//
// Pins SPECIFICATION/non-functional-requirements.md §"Top-of-pyramid
// discipline": every load-bearing scenario in SPECIFICATION/scenarios.md is
// classified browser-observable or non-browser-exercisable and carries a
// committed mapping of that class (a Playwright identifier, or a named
// non-Playwright category + rationale), and `bun run check` fails on a
// missing, stale, mis-typed, or class-dodging mapping. Identifier resolution
// is armed-but-vacuous until first-party src/** product source lands.
//
// Negative cases start from the repository's real scenarios.md and
// scenario-coverage.json (so the gate's pinned classification applies) and
// mutate a clone of the coverage mapping in a throwaway fixture.

import { afterAll, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const scenariosGate = join(repoRoot, "scripts", "check-scenarios.ts");
const realSpec = readFileSync(
  join(repoRoot, "SPECIFICATION", "scenarios.md"),
  "utf8",
);

interface Mapping {
  scenario: string;
  class: string;
  playwright?: string[];
  category?: string;
  tests?: string[];
  rationale?: string;
}
interface Coverage {
  note?: string;
  nonBrowserCategories?: string[];
  mappings: Mapping[];
}

const baseline = JSON.parse(
  readFileSync(join(repoRoot, "scenario-coverage.json"), "utf8"),
) as Coverage;

function clone(): Coverage {
  return JSON.parse(JSON.stringify(baseline)) as Coverage;
}

function find(coverage: Coverage, scenario: string): Mapping {
  const entry = coverage.mappings.find((m) => m.scenario === scenario);
  if (entry === undefined) {
    throw new Error(`test setup: no baseline mapping for "${scenario}"`);
  }
  return entry;
}

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

interface FixtureOptions {
  readonly coverage?: Coverage | null;
  readonly spec?: string;
  readonly withProductSource?: boolean;
  // How to materialize each mapped test identifier's file:
  // "executable" writes a real test(...) declaration, "comment" writes only a
  // comment line with the title, "commented-call" writes a commented-out full
  // test(...) call, "skipped" writes a test.skip(...) placeholder.
  readonly writeTests?: "executable" | "comment" | "commented-call" | "skipped";
}

type WriteMode = NonNullable<FixtureOptions["writeTests"]>;

function renderTest(mode: WriteMode, title: string) {
  if (mode === "comment") {
    return `// ${title}\n`;
  }
  if (mode === "commented-call") {
    return `// test(${JSON.stringify(title)}, () => {});\n`;
  }
  const call = mode === "skipped" ? "test.skip" : "test";
  return `${call}(${JSON.stringify(title)}, () => {});\n`;
}

function makeFixture(options: FixtureOptions = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-scenarios-fixture-"));
  fixtures.push(dir);
  mkdirSync(join(dir, "SPECIFICATION"), { recursive: true });
  writeFileSync(
    join(dir, "SPECIFICATION", "scenarios.md"),
    options.spec ?? realSpec,
  );
  const coverage = options.coverage === undefined ? baseline : options.coverage;
  if (coverage !== null) {
    writeFileSync(
      join(dir, "scenario-coverage.json"),
      JSON.stringify(coverage, null, 2),
    );
  }
  if (options.withProductSource) {
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, "src", "index.ts"), "export const x = 1;\n");
  }
  if (options.writeTests !== undefined && coverage !== null) {
    const mode = options.writeTests;
    const titlesByPath = new Map<string, string[]>();
    for (const mapping of coverage.mappings) {
      for (const id of [
        ...(mapping.playwright ?? []),
        ...(mapping.tests ?? []),
      ]) {
        const sep = id.indexOf(" > ");
        if (sep === -1) {
          continue;
        }
        const path = id.slice(0, sep).trim();
        const title = id.slice(sep + 3).trim();
        const titles = titlesByPath.get(path) ?? [];
        titles.push(title);
        titlesByPath.set(path, titles);
      }
    }
    for (const [path, titles] of titlesByPath) {
      const abs = join(dir, path);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(
        abs,
        titles.map((title) => renderTest(mode, title)).join(""),
      );
    }
  }
  return dir;
}

function runScenarios(root: string): {
  exitCode: number | null;
  output: string;
} {
  const run = Bun.spawnSync({
    cmd: ["bun", scenariosGate, "--project-root", root],
    cwd: repoRoot,
  });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

describe("scenario coverage gate (li-hb77ad)", () => {
  test("the repository passes with the gate active (src present, identifiers resolve)", () => {
    const { exitCode, output } = runScenarios(repoRoot);
    expect(output).toContain("every identifier resolves");
    expect(output).toContain("browser-observable");
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("a complete valid mapping passes armed", () => {
    const { exitCode, output } = runScenarios(makeFixture());
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("a missing coverage file fails", () => {
    const { exitCode, output } = runScenarios(makeFixture({ coverage: null }));
    expect(exitCode).toBe(1);
    expect(output).toContain("scenario-coverage.json");
    expect(output).toContain("missing");
  }, 60000);

  test("a load-bearing scenario with no mapping fails", () => {
    const coverage = clone();
    coverage.mappings = coverage.mappings.filter(
      (m) => m.scenario !== "Visitor opens the interactive resume",
    );
    const { exitCode, output } = runScenarios(makeFixture({ coverage }));
    expect(exitCode).toBe(1);
    expect(output).toContain("Visitor opens the interactive resume");
    expect(output).toContain("no mapping");
  }, 60000);

  test("a stale mapping (no such scenario) fails", () => {
    const coverage = clone();
    coverage.mappings.push({
      scenario: "A scenario that does not exist in the spec",
      class: "browser-observable",
      playwright: ["e2e/ghost.e2e.ts > ghost"],
    });
    const { exitCode, output } = runScenarios(makeFixture({ coverage }));
    expect(exitCode).toBe(1);
    expect(output).toContain("stale");
  }, 60000);

  test("mapping a later-phase scenario fails", () => {
    const coverage = clone();
    coverage.mappings.push({
      scenario: "Visitor asks an answerable AI question",
      class: "browser-observable",
      playwright: ["e2e/ai.e2e.ts > answerable"],
    });
    const { exitCode, output } = runScenarios(makeFixture({ coverage }));
    expect(exitCode).toBe(1);
    expect(output).toContain("later-phase");
  }, 60000);

  test("re-declaring a browser-observable scenario as non-browser to dodge Playwright fails", () => {
    const coverage = clone();
    const entry = find(coverage, "Visitor opens the interactive resume");
    entry.class = "non-browser-exercisable";
    delete entry.playwright;
    entry.category = "vitest-unit";
    entry.tests = ["src/lib/x.test.ts > opens"];
    entry.rationale = "pretending this is not browser-observable";
    const { exitCode, output } = runScenarios(makeFixture({ coverage }));
    expect(exitCode).toBe(1);
    expect(output).toContain("pinned class");
  }, 60000);

  test("a browser-observable scenario with no Playwright identifier fails", () => {
    const coverage = clone();
    find(coverage, "Visitor opens the interactive resume").playwright = [];
    const { exitCode, output } = runScenarios(makeFixture({ coverage }));
    expect(exitCode).toBe(1);
    expect(output).toContain("at least one Playwright");
  }, 60000);

  test("a browser-observable scenario mapped to a non-e2e file fails", () => {
    const coverage = clone();
    find(coverage, "Visitor opens the interactive resume").playwright = [
      "src/lib/opens.test.ts > opens",
    ];
    const { exitCode, output } = runScenarios(makeFixture({ coverage }));
    expect(exitCode).toBe(1);
    expect(output).toContain("not a Playwright e2e spec");
  }, 60000);

  test("a non-browser scenario without a rationale fails", () => {
    const coverage = clone();
    delete find(
      coverage,
      "Search projection is generated without a browser DOM",
    ).rationale;
    const { exitCode, output } = runScenarios(makeFixture({ coverage }));
    expect(exitCode).toBe(1);
    expect(output).toContain("rationale");
  }, 60000);

  test("a non-browser scenario with an unknown category fails", () => {
    const coverage = clone();
    find(
      coverage,
      "Search projection is generated without a browser DOM",
    ).category = "cypress";
    const { exitCode, output } = runScenarios(makeFixture({ coverage }));
    expect(exitCode).toBe(1);
    expect(output).toContain("category");
  }, 60000);

  test("a malformed identifier fails", () => {
    const coverage = clone();
    find(coverage, "Visitor opens the interactive resume").playwright = [
      "no-separator-here.e2e.ts",
    ];
    const { exitCode, output } = runScenarios(makeFixture({ coverage }));
    expect(exitCode).toBe(1);
    expect(output).toContain("malformed");
  }, 60000);

  test("adding a load-bearing scenario without pinning its class fails", () => {
    const spec = realSpec.replace(
      "## Later-phase scenarios",
      "## Scenario: A brand new phase-1 scenario\n\nGiven something\n\n## Later-phase scenarios",
    );
    const { exitCode, output } = runScenarios(makeFixture({ spec }));
    expect(exitCode).toBe(1);
    expect(output).toContain("no pinned class");
  }, 60000);

  test("identifier resolution is enforced once src/** product source lands", () => {
    const { exitCode, output } = runScenarios(
      makeFixture({ withProductSource: true }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("does not exist");
  }, 60000);

  test("the gate is green once src/** and every referenced executable test exist", () => {
    const { exitCode, output } = runScenarios(
      makeFixture({ withProductSource: true, writeTests: "executable" }),
    );
    expect(output).not.toContain("FAIL");
    expect(output).toContain("ok");
    expect(exitCode).toBe(0);
  }, 60000);

  test("comment-only test titles do not resolve once src/** lands", () => {
    // Reproducer for the resolveIdentifier raw-includes bypass: files that
    // merely mention each title in a comment must NOT satisfy the gate.
    const { exitCode, output } = runScenarios(
      makeFixture({ withProductSource: true, writeTests: "comment" }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("no executable test");
  }, 60000);

  test("commented-out full test(...) calls do not resolve once src/** lands", () => {
    // Reproducer for the collectTestDecls comment-scan bypass: a disabled
    // `// test("<title>", ...)` call must NOT satisfy the gate — the resolver
    // parses the AST, which carries no commented-out code.
    const { exitCode, output } = runScenarios(
      makeFixture({ withProductSource: true, writeTests: "commented-call" }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("no executable test");
  }, 60000);

  test("skipped/pending tests do not resolve once src/** lands", () => {
    const { exitCode, output } = runScenarios(
      makeFixture({ withProductSource: true, writeTests: "skipped" }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("skipped/pending");
  }, 60000);

  test("the aggregate check runs the scenario gate as operational", () => {
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
      },
    });
    const output = run.stdout.toString() + run.stderr.toString();
    const gateLine = output
      .split("\n")
      .find((line) => line.includes("scenario coverage"));
    expect(gateLine).toBeDefined();
    expect(gateLine).toContain("[ok]");
    expect(run.exitCode).toBe(0);
  }, 240000);
});
