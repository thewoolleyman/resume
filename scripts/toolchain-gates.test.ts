// Harness test for the TypeScript, Svelte, lint, and format gates
// (work item li-tagohm; plan/guardrail/research/findings.md slice 3).
//
// Pins SPECIFICATION/non-functional-requirements.md §"TypeScript quality
// gates": strict TypeScript with the five required flags, svelte-check,
// type-aware ESLint at the strict-type-checked baseline with Svelte-aware
// linting, Prettier format checking, zero lint warnings, and a baseline that
// cannot weaken silently — `bun run check` fails when a required flag or
// rule family is dropped.

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

const REQUIRED_TS_FLAGS = [
  "strict",
  "noImplicitOverride",
  "noUncheckedIndexedAccess",
  "exactOptionalPropertyTypes",
  "useUnknownInCatchVariables",
] as const;

const NESTED_ENV = {
  CHECK_SKIP_HARNESS_TESTS: "1",
  CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
};

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

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

interface ToolchainFixtureOptions {
  readonly omitTsFlag?: string;
  readonly lintScript?: string;
}

// A fixture whose toolchain configuration is fully at baseline unless
// perturbed by the options.
function makeToolchainFixture(options: ToolchainFixtureOptions = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-toolchain-fixture-"));
  fixtures.push(dir);
  mkdirSync(join(dir, ".githooks"), { recursive: true });
  const scripts: Record<string, string> = {};
  for (const name of REQUIRED_SCRIPTS) {
    scripts[name] = "true";
  }
  scripts["bootstrap"] = "bun install && bun scripts/install-hooks.ts";
  scripts["typecheck"] = "tsc --noEmit && svelte-check";
  scripts["lint"] = options.lintScript ?? "eslint . --max-warnings 0";
  scripts["lint:fix"] = "eslint . --fix";
  scripts["format"] = "prettier --write .";
  scripts["format:check"] = "prettier --check .";
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "fixture",
      private: true,
      type: "module",
      engines: { bun: "1.3.6" },
      scripts,
    }),
  );
  const compilerOptions = Object.fromEntries(
    REQUIRED_TS_FLAGS.filter((flag) => flag !== options.omitTsFlag).map(
      (flag) => [flag, true],
    ),
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({ compilerOptions }),
  );
  writeFileSync(join(dir, "eslint.config.js"), "export default [];\n");
  writeFileSync(join(dir, ".prettierrc.json"), "{}\n");
  return dir;
}

function runCheck(
  projectRoot: string,
  env: Record<string, string> = NESTED_ENV,
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

function runScript(name: string): { exitCode: number | null; output: string } {
  const run = Bun.spawnSync({ cmd: ["bun", "run", name], cwd: repoRoot });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

describe("toolchain configuration baseline (li-tagohm)", () => {
  test("typecheck, lint, and format scripts are provisioned (not stubs)", () => {
    const pkg = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };
    for (const name of [
      "typecheck",
      "lint",
      "lint:fix",
      "format",
      "format:check",
    ]) {
      expect(pkg.scripts?.[name] ?? "").not.toContain("not-yet-provisioned");
    }
  });

  test("tsconfig.json enables every required strictness flag", () => {
    const tsconfig = JSON.parse(
      readFileSync(join(repoRoot, "tsconfig.json"), "utf8"),
    ) as { compilerOptions?: Record<string, unknown> };
    for (const flag of REQUIRED_TS_FLAGS) {
      expect(tsconfig.compilerOptions?.[flag]).toBe(true);
    }
  });

  test("bun run typecheck passes (tsc + svelte-check)", () => {
    const { exitCode, output } = runScript("typecheck");
    expect(output).toContain("svelte-check");
    expect(exitCode).toBe(0);
  }, 180000);

  test("bun run lint passes with zero warnings tolerated", () => {
    const pkg = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.["lint"] ?? "").toContain("--max-warnings 0");
    const { exitCode } = runScript("lint");
    expect(exitCode).toBe(0);
  }, 180000);

  test("bun run format:check passes", () => {
    const { exitCode } = runScript("format:check");
    expect(exitCode).toBe(0);
  }, 180000);

  test("the aggregate check verifies the toolchain baseline and stops listing li-tagohm as pending", () => {
    const { exitCode, output } = runCheck(repoRoot);
    expect(output).toContain("toolchain configuration baseline");
    expect(output).not.toContain("arrives with li-tagohm");
    expect(exitCode).toBe(0);
  }, 180000);

  test("a dropped TypeScript strictness flag fails the aggregate check by name", () => {
    const { exitCode, output } = runCheck(
      makeToolchainFixture({ omitTsFlag: "exactOptionalPropertyTypes" }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("exactOptionalPropertyTypes");
  });

  test("a lint script that tolerates warnings fails the aggregate check", () => {
    const { exitCode, output } = runCheck(
      makeToolchainFixture({ lintScript: "eslint ." }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("--max-warnings 0");
  });
});
