// Harness test for the repository bootstrap and package-script surface
// (work item li-ugymfg; plan/guardrail/research/findings.md slice 1).
//
// Pins the contract from SPECIFICATION/non-functional-requirements.md
// §"Package script categories": every required Bun script name exists in
// package.json, `bootstrap` installs the committed hooks, tool versions are
// pinned, and a not-yet-provisioned script fails with exit code 3 (the
// §"Exit-code baseline" precondition-failure code) rather than passing
// silently. Runs on Bun's built-in test runner: `bun test scripts`.

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const packageJsonPath = join(repoRoot, "package.json");

// §"Package script categories" required minimum, plus the separate mutating
// fix commands the Lint-and-format category requires (`format`, `lint:fix`)
// and the harness-test runner itself.
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

interface PackageJson {
  readonly engines?: Record<string, string>;
  readonly scripts?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
}

function readPackageJson(): PackageJson | null {
  if (!existsSync(packageJsonPath)) {
    return null;
  }
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
}

describe("required Bun package-script surface (li-ugymfg)", () => {
  test("package.json exists at the repository root", () => {
    expect(existsSync(packageJsonPath)).toBe(true);
  });

  test("every required script name is present", () => {
    const pkg = readPackageJson();
    expect(pkg).not.toBeNull();
    const scripts = pkg?.scripts ?? {};
    const missing = REQUIRED_SCRIPTS.filter((name) => !(name in scripts));
    expect(missing).toEqual([]);
  });

  test("bootstrap installs dependencies and the committed hooks", () => {
    const bootstrap = readPackageJson()?.scripts?.["bootstrap"] ?? "";
    expect(bootstrap).toContain("bun install");
    expect(bootstrap).toContain("install-hooks");
  });

  test("the committed hooks directory exists for bootstrap to install", () => {
    expect(existsSync(join(repoRoot, ".githooks"))).toBe(true);
  });

  test("the Bun toolchain version is pinned exactly", () => {
    const bunPin = readPackageJson()?.engines?.["bun"] ?? "";
    expect(bunPin).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("dependency versions are pinned exactly (no range specifiers)", () => {
    const pkg = readPackageJson();
    const declared = {
      ...(pkg?.dependencies ?? {}),
      ...(pkg?.devDependencies ?? {}),
    };
    const ranged = Object.entries(declared).filter(
      ([, version]) => !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version),
    );
    expect(ranged).toEqual([]);
  });
});

describe("not-yet-provisioned script stubs (exit-code baseline)", () => {
  test("a stubbed script fails with exit 3 and names its provisioning work item", () => {
    const run = Bun.spawnSync({
      cmd: ["bun", join(repoRoot, "scripts", "not-yet-provisioned.ts"), "tdd-commit"],
      cwd: repoRoot,
    });
    const output = run.stdout.toString() + run.stderr.toString();
    expect(run.exitCode).toBe(3);
    expect(output).toContain("li-avk7d7");
    expect(output).toContain("not yet provisioned");
  });

  test("an unknown script name is a usage error (exit 2)", () => {
    const run = Bun.spawnSync({
      cmd: ["bun", join(repoRoot, "scripts", "not-yet-provisioned.ts")],
      cwd: repoRoot,
    });
    expect(run.exitCode).toBe(2);
  });
});
