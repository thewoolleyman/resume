// Harness test for the discipline-adoption inventory gate.
//
// Pins SPECIFICATION/non-functional-requirements.md §"Discipline adoption
// inventory": .ai/discipline-adoption.md exists, carries every seed-listed
// baseline row with the required columns, uses only the allowed dispositions
// (adopted, locally adapted, deferred, rejected) and enforcement classes
// (gate-enforced, process-enforced, documented-only, none); gate- and
// process-enforced rows cite existing runnable commands, hooks, workflows,
// or committed records; documented-only rows are not described as enforced;
// deferred/rejected rows use class none with a reason and a revisit
// condition; the TDD row is gate-enforced citing the Red -> Green
// commit-msg hook; and the ecosystem row cites the §"Livespec ecosystem
// tooling adoption" enumeration.

import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const inventoryScript = join(
  repoRoot,
  "scripts",
  "check-discipline-inventory.ts",
);

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

interface Row {
  discipline: string;
  source: string;
  disposition: string;
  enforcementClass: string;
  artifact: string;
  coverage: string;
  notes: string;
}

function row(overrides: Partial<Row> & Pick<Row, "discipline">): Row {
  return {
    source: "seed",
    disposition: "adopted",
    enforcementClass: "gate-enforced",
    artifact: "`bun run check`",
    coverage: "aggregate gate",
    notes: "baseline",
    ...overrides,
  };
}

const deferredRow = (discipline: string): Row =>
  row({
    discipline,
    disposition: "deferred",
    enforcementClass: "none",
    artifact: "—",
    coverage: "none",
    notes: "reason: arrives with a later slice; revisit when it lands",
  });

// A shape-valid baseline: every seed-listed discipline, satisfying every
// rule the checker enforces, with citations resolvable inside the fixture.
function baselineRows(): Row[] {
  return [
    row({
      discipline: "TDD",
      artifact: "`.githooks/commit-msg`",
      notes: "content-triggered Red -> Green commit protocol",
    }),
    row({
      discipline: "livespec-dev-tooling-inspired shared guidelines",
      disposition: "locally adapted",
    }),
    row({
      discipline: "applicable livespec ecosystem tooling",
      source: 'NFR §"Livespec ecosystem tooling adoption" enumeration',
      disposition: "locally adapted",
      enforcementClass: "documented-only",
      artifact: "spec enumeration",
      coverage: "none",
      notes: "not enforced — reason: plugin lifecycle runs interactively",
    }),
    deferredRow("GitHub CI and pull-request discipline"),
    deferredRow("release discipline"),
    deferredRow("top-of-pyramid E2E discipline"),
    row({ discipline: "linting", artifact: "`bun run lint`" }),
    deferredRow("fuzzing and property checks"),
    row({
      discipline: "local memory guardrails",
      artifact: "`bun run check:memory`",
    }),
    row({
      discipline: "standalone dependency boundaries",
      enforcementClass: "documented-only",
      artifact: "committed Bun/TypeScript harness only",
      coverage: "none",
      notes: "not enforced — reason: no mechanical import scan yet",
    }),
    row({
      discipline:
        "Bun/Vitest/Playwright/Svelte/SvelteKit/Vercel toolchain discipline",
      disposition: "locally adapted",
    }),
    row({
      discipline: "beads-fabro work-item workflow",
      enforcementClass: "process-enforced",
      artifact: "`.beads/config.yaml`",
      coverage: "citation presence via this gate",
      notes: "closure merge-evidence lives in the beads store",
    }),
  ];
}

function renderTable(rows: readonly Row[]): string {
  const header =
    "| Discipline | Source inspiration | Disposition | Enforcement class " +
    "| Local enforcement artifact | Aggregate-check coverage | Notes |\n" +
    "| --- | --- | --- | --- | --- | --- | --- |\n";
  const body = rows
    .map(
      (r) =>
        `| ${r.discipline} | ${r.source} | ${r.disposition} ` +
        `| ${r.enforcementClass} | ${r.artifact} | ${r.coverage} | ${r.notes} |`,
    )
    .join("\n");
  return `# Discipline adoption inventory\n\n${header}${body}\n`;
}

interface FixtureOptions {
  readonly rows?: readonly Row[];
  readonly withoutInventory?: boolean;
}

function makeFixture(options: FixtureOptions = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-inventory-fixture-"));
  fixtures.push(dir);
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "fixture",
      private: true,
      type: "module",
      scripts: {
        check: "true",
        lint: "true",
        "check:memory": "true",
        "check:result": "bun scripts/not-yet-provisioned.ts check:result",
      },
    }),
  );
  mkdirSync(join(dir, ".githooks"), { recursive: true });
  writeFileSync(join(dir, ".githooks", "commit-msg"), "#!/usr/bin/env bash\n");
  mkdirSync(join(dir, ".beads"), { recursive: true });
  writeFileSync(join(dir, ".beads", "config.yaml"), "dolt.mode: server\n");
  if (!options.withoutInventory) {
    mkdirSync(join(dir, ".ai"), { recursive: true });
    writeFileSync(
      join(dir, ".ai", "discipline-adoption.md"),
      renderTable(options.rows ?? baselineRows()),
    );
  }
  return dir;
}

function runInventory(root: string): {
  exitCode: number | null;
  output: string;
} {
  const run = Bun.spawnSync({
    cmd: ["bun", inventoryScript, "--project-root", root],
    cwd: repoRoot,
  });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

function mutate(discipline: string, overrides: Partial<Row>): readonly Row[] {
  return baselineRows().map((r) =>
    r.discipline === discipline ? { ...r, ...overrides } : r,
  );
}

describe("discipline-adoption inventory gate (li-6b6u6m)", () => {
  test("the repository's committed inventory passes", () => {
    const { exitCode, output } = runInventory(repoRoot);
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  });

  test("a shape-valid fixture inventory passes", () => {
    expect(runInventory(makeFixture()).exitCode).toBe(0);
  });

  test("a missing inventory is a precondition failure (exit 3)", () => {
    const { exitCode } = runInventory(makeFixture({ withoutInventory: true }));
    expect(exitCode).toBe(3);
  });

  test("a missing baseline row fails, naming the discipline", () => {
    const rows = baselineRows().filter((r) => r.discipline !== "linting");
    const { exitCode, output } = runInventory(makeFixture({ rows }));
    expect(exitCode).toBe(1);
    expect(output).toContain("linting");
  });

  test("an unknown disposition fails", () => {
    const { exitCode, output } = runInventory(
      makeFixture({ rows: mutate("linting", { disposition: "maybe" }) }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("disposition");
  });

  test("an unknown enforcement class fails", () => {
    const { exitCode, output } = runInventory(
      makeFixture({
        rows: mutate("linting", { enforcementClass: "hoped-for" }),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("enforcement class");
  });

  test("a gate-enforced row citing a missing script fails", () => {
    const { exitCode, output } = runInventory(
      makeFixture({
        rows: mutate("linting", { artifact: "`bun run ghost`" }),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("ghost");
  });

  test("a gate-enforced row citing a not-yet-provisioned stub fails", () => {
    const { exitCode, output } = runInventory(
      makeFixture({
        rows: mutate("linting", { artifact: "`bun run check:result`" }),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("check:result");
  });

  test("a gate-enforced row citing a missing path fails", () => {
    const { exitCode, output } = runInventory(
      makeFixture({
        rows: mutate("linting", { artifact: "`scripts/ghost-gate.ts`" }),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("ghost-gate");
  });

  test("a gate-enforced row with no resolvable citation fails", () => {
    const { exitCode, output } = runInventory(
      makeFixture({
        rows: mutate("linting", { artifact: "we lint carefully" }),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("linting");
  });

  test("a deferred row must use enforcement class none", () => {
    const { exitCode } = runInventory(
      makeFixture({
        rows: mutate("release discipline", {
          enforcementClass: "gate-enforced",
        }),
      }),
    );
    expect(exitCode).toBe(1);
  });

  test("a deferred row without a revisit condition fails", () => {
    const { exitCode, output } = runInventory(
      makeFixture({
        rows: mutate("release discipline", {
          notes: "reason: waiting on a later slice",
        }),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("revisit");
  });

  test("enforcement class none requires a deferred or rejected disposition", () => {
    const { exitCode } = runInventory(
      makeFixture({
        rows: mutate("linting", {
          enforcementClass: "none",
          coverage: "none",
        }),
      }),
    );
    expect(exitCode).toBe(1);
  });

  test("a documented-only row claiming aggregate coverage fails", () => {
    const { exitCode, output } = runInventory(
      makeFixture({
        rows: mutate("standalone dependency boundaries", {
          coverage: "bun run check",
        }),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("documented-only");
  });

  test("the TDD row must stay gate-enforced, citing the commit-msg hook", () => {
    const { exitCode, output } = runInventory(
      makeFixture({
        rows: mutate("TDD", {
          enforcementClass: "documented-only",
          coverage: "none",
          notes: "not enforced — reason: demoted by mistake",
        }),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("TDD");
  });

  test("the ecosystem row must cite the spec enumeration", () => {
    const { exitCode, output } = runInventory(
      makeFixture({
        rows: mutate("applicable livespec ecosystem tooling", {
          source: "a generic undefined row",
        }),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("enumeration");
  });

  test("the aggregate check runs the inventory gate as operational", () => {
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
      .find((line) => line.includes("discipline-adoption inventory"));
    expect(gateLine).toBeDefined();
    expect(gateLine).toContain("[ok]");
    expect(run.exitCode).toBe(0);
  }, 240000);
});
