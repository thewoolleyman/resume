// Harness test for the TypeScript, Svelte, lint, and format gates.
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
  symlinkSync,
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
  // Skip the build and Playwright e2e gates in these nested aggregate runs:
  // this suite verifies the toolchain-baseline gate, not build/e2e, and the
  // e2e gate binds a fixed port (4173) — running it here would collide with
  // the other operational-gate self-tests' nested e2e under CI, where
  // reuseExistingServer is off.
  CHECK_SKIP_BUILD: "1",
  CHECK_SKIP_E2E: "1",
  CHECK_SKIP_COVERAGE: "1",
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
  readonly eslintConfig?: string;
}

// A fixture ESLint config carrying every required rule family as real
// config entries (it is scanned by the aggregate check, never executed).
const BASELINE_ESLINT_CONFIG = `import prettier from "eslint-config-prettier";
import perfectionist from "eslint-plugin-perfectionist";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";

export default [
  ...tseslint.configs.strictTypeChecked,
  ...svelte.configs.recommended,
  {
    plugins: { perfectionist },
    rules: {
      "perfectionist/sort-imports": "error",
      "svelte/valid-compile": "error",
      "no-restricted-imports": ["error", {}],
    },
  },
  prettier,
];
`;

// A fixture whose toolchain configuration is fully at baseline unless
// perturbed by the options.
function makeToolchainFixture(options: ToolchainFixtureOptions = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-toolchain-fixture-"));
  fixtures.push(dir);
  mkdirSync(join(dir, ".githooks"), { recursive: true });
  // Wire the primary-checkout commit-refuse hook so the aggregate check's
  // checkPrimaryCheckoutHook gate passes for this otherwise-compliant tree.
  writeFileSync(
    join(dir, ".githooks", "pre-commit"),
    "#!/usr/bin/env bash\nset -euo pipefail\n" +
      'hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"\n' +
      'bun "$hook_dir/../scripts/check-primary-checkout.ts"\n' +
      'exec bun "$hook_dir/../scripts/check-memory.ts" --staged\n',
  );
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
  writeFileSync(
    join(dir, "eslint.config.js"),
    options.eslintConfig ?? "export default [];\n",
  );
  writeFileSync(join(dir, ".prettierrc.json"), "{}\n");
  // The effective-rule verification loads the fixture's eslint.config.js
  // through ESLint itself, so plugin imports must resolve.
  symlinkSync(join(repoRoot, "node_modules"), join(dir, "node_modules"), "dir");
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

  test("an eslint config with every rule family as real entries passes", () => {
    const { exitCode } = runCheck(
      makeToolchainFixture({ eslintConfig: BASELINE_ESLINT_CONFIG }),
    );
    expect(exitCode).toBe(0);
  });

  test("removing the svelte/valid-compile rule fails even when comments still mention it", () => {
    const spoofed = BASELINE_ESLINT_CONFIG.replace(
      '      "svelte/valid-compile": "error",\n',
      "      // svelte/valid-compile is enforced elsewhere, honest\n",
    );
    expect(spoofed).toContain("svelte/valid-compile");
    const { exitCode, output } = runCheck(
      makeToolchainFixture({ eslintConfig: spoofed }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("svelte/valid-compile");
  });

  test("removing the no-restricted-imports rule fails even when comments still mention it", () => {
    const spoofed = BASELINE_ESLINT_CONFIG.replace(
      '      "no-restricted-imports": ["error", {}],\n',
      "      /* no-restricted-imports handled by convention */\n",
    );
    expect(spoofed).toContain("no-restricted-imports");
    const { exitCode, output } = runCheck(
      makeToolchainFixture({ eslintConfig: spoofed }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("no-restricted-imports");
  });

  test("a required rule disabled with severity off fails by name (svelte/valid-compile)", () => {
    const disabled = BASELINE_ESLINT_CONFIG.replace(
      '"svelte/valid-compile": "error"',
      '"svelte/valid-compile": "off"',
    );
    const { exitCode, output } = runCheck(
      makeToolchainFixture({ eslintConfig: disabled }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("svelte/valid-compile");
  });

  test("a required rule disabled with severity off fails by name (no-restricted-imports)", () => {
    const disabled = BASELINE_ESLINT_CONFIG.replace(
      '"no-restricted-imports": ["error", {}]',
      '"no-restricted-imports": "off"',
    );
    const { exitCode, output } = runCheck(
      makeToolchainFixture({ eslintConfig: disabled }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("no-restricted-imports");
  });

  test("a required rule demoted to warn fails by name", () => {
    const demoted = BASELINE_ESLINT_CONFIG.replace(
      '"svelte/valid-compile": "error"',
      '"svelte/valid-compile": "warn"',
    );
    const { exitCode, output } = runCheck(
      makeToolchainFixture({ eslintConfig: demoted }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("svelte/valid-compile");
  });

  test("a later config block overriding a required rule to off fails by name", () => {
    const overridden = BASELINE_ESLINT_CONFIG.replace(
      "  prettier,\n",
      '  { rules: { "no-restricted-imports": "off" } },\n  prettier,\n',
    );
    const { exitCode, output } = runCheck(
      makeToolchainFixture({ eslintConfig: overridden }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("no-restricted-imports");
  });
});
