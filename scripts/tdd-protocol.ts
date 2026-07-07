// Shared library for the content-triggered Red -> Green TDD commit protocol
// (SPECIFICATION/non-functional-requirements.md §"Mechanically enforced
// Red -> Green commit protocol"). Used by the commit-msg hook
// (tdd-commit-msg-hook.ts), the branch-range validator (tdd-range-check.ts),
// and the tdd-commit helper. Standalone Bun/TypeScript only.

import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface RunResult {
  readonly exitCode: number | null;
  readonly output: string;
}

export function run(
  cwd: string,
  cmd: readonly string[],
  env?: Record<string, string>,
): RunResult {
  const proc = Bun.spawnSync({
    cmd: [...cmd],
    cwd,
    env: { ...process.env, ...(env ?? {}) },
  });
  return {
    exitCode: proc.exitCode,
    output: proc.stdout.toString() + proc.stderr.toString(),
  };
}

export function git(cwd: string, ...args: readonly string[]): RunResult {
  return run(cwd, ["git", ...args]);
}

export function gitShowBytes(
  cwd: string,
  indexPath: string,
): Uint8Array | null {
  const proc = Bun.spawnSync({ cmd: ["git", "show", `:${indexPath}`], cwd });
  if (proc.exitCode !== 0) {
    return null;
  }
  return new Uint8Array(proc.stdout);
}

export function sha256(data: string | Uint8Array): string {
  return `sha256:${createHash("sha256").update(data).digest("hex")}`;
}

export const CHECKSUM_PATTERN = /^sha256:[0-9a-f]{64}$/;

// Bucket classification. Test files: *.test.ts, *.spec.ts, and Playwright
// specs under e2e/**. First-party product source: repository-authored
// implementation files under src/** (test artifacts, snapshots, and
// generated SvelteKit output excluded). Everything else participates in
// neither bucket.
export function isTestFile(path: string): boolean {
  return (
    path.endsWith(".test.ts") ||
    path.endsWith(".spec.ts") ||
    path.startsWith("e2e/")
  );
}

export function isProductSource(path: string): boolean {
  if (!path.startsWith("src/")) {
    return false;
  }
  if (isTestFile(path)) {
    return false;
  }
  if (path.includes("__snapshots__/") || path.includes("__fixtures__/")) {
    return false;
  }
  return true;
}

// Staged paths, excluding deletions (--diff-filter=ACMR): staged deletions
// never select a leg.
export function stagedPaths(root: string): string[] {
  const res = git(
    root,
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
  );
  return res.output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export const RED_TRAILERS = [
  "TDD-Red-Test",
  "TDD-Red-Failure-Reason",
  "TDD-Red-Test-File-Checksum",
  "TDD-Red-Output-Checksum",
  "TDD-Red-Captured-At",
] as const;

export const GREEN_TRAILERS = [
  "TDD-Green-Verified-At",
  "TDD-Green-Parent-Reflog",
] as const;

export const SUITE_TRAILERS = [
  "TDD-Suite-Green-Scope",
  "TDD-Suite-Green-Output-Checksum",
  "TDD-Suite-Green-Captured-At",
] as const;

export function parseTrailers(message: string): Map<string, string> {
  const trailers = new Map<string, string>();
  for (const line of message.split("\n")) {
    const match = /^(TDD-[A-Za-z-]+):\s*(.*)$/.exec(line);
    const key = match?.[1];
    const value = match?.[2];
    if (key !== undefined && value !== undefined) {
      trailers.set(key, value.trim());
    }
  }
  return trailers;
}

export function hasAll(
  trailers: Map<string, string>,
  keys: readonly string[],
): boolean {
  return keys.every((key) => trailers.has(key));
}

// Exports the staged tree (the index) into a throwaway directory so tests
// run against exactly what the commit will contain, then links node_modules
// so runners resolve. Caller removes the directory.
export function checkoutStagedTree(root: string): string {
  const tmp = mkdtempSync(join(tmpdir(), "tdd-staged-"));
  const res = git(root, "checkout-index", "--all", `--prefix=${tmp}/`);
  if (res.exitCode !== 0) {
    throw new Error(`git checkout-index failed: ${res.output}`);
  }
  const nodeModules = join(root, "node_modules");
  if (existsSync(nodeModules) && !existsSync(join(tmp, "node_modules"))) {
    symlinkSync(nodeModules, join(tmp, "node_modules"), "dir");
  }
  return tmp;
}

interface PackageJson {
  readonly scripts?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

function readPackageJson(root: string): PackageJson {
  const path = join(root, "package.json");
  if (!existsSync(path)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as PackageJson;
  } catch {
    return {};
  }
}

// The command that runs one anchor test file: Playwright for e2e specs,
// Vitest once it is part of the toolchain, Bun's built-in runner until then
// (the documented interim runner for harness-era tests).
export function anchorRunnerCommand(
  root: string,
  anchorPath: string,
): string[] {
  if (anchorPath.startsWith("e2e/")) {
    return ["bunx", "playwright", "test", anchorPath];
  }
  const pkg = readPackageJson(root);
  if ((pkg.devDependencies ?? {})["vitest"] !== undefined) {
    return ["bunx", "vitest", "run", anchorPath];
  }
  return ["bun", "test", anchorPath];
}

// A Red failure must be a real assertion failure, not an import/collection
// error (documented v1 heuristic).
export function isMeaninglessFailure(output: string): boolean {
  return /Cannot find module|Could not resolve|SyntaxError|ScriptNotFound/i.test(
    output,
  );
}

// The full-suite command set: every provisioned (non-stub) test script.
export function fullSuiteScripts(root: string): string[] {
  const scripts = readPackageJson(root).scripts ?? {};
  return ["test:harness", "test:unit", "test:integration", "test:e2e"].filter(
    (name) => {
      const command = scripts[name];
      return command !== undefined && !command.includes("not-yet-provisioned");
    },
  );
}

export interface SuiteResult {
  readonly ok: boolean;
  readonly output: string;
  readonly totalTests: number;
  readonly failureDetail: string;
}

export function runFullSuite(stagedRoot: string): SuiteResult {
  const scripts = fullSuiteScripts(stagedRoot);
  if (scripts.length === 0) {
    return {
      ok: false,
      output: "",
      totalTests: 0,
      failureDetail: "no provisioned test scripts to run (zero-test run)",
    };
  }
  let output = "";
  let totalTests = 0;
  for (const script of scripts) {
    const res = run(stagedRoot, ["bun", "run", script]);
    output += res.output;
    for (const match of res.output.matchAll(/Ran (\d+) tests? across/g)) {
      totalTests += Number(match[1] ?? 0);
    }
    for (const match of res.output.matchAll(/(\d+) passed/g)) {
      totalTests += Number(match[1] ?? 0);
    }
    if (res.exitCode !== 0) {
      const tail = res.output.trim().split("\n").slice(-4).join(" | ");
      return {
        ok: false,
        output,
        totalTests,
        failureDetail: `bun run ${script} failed: ${tail}`,
      };
    }
  }
  if (totalTests === 0) {
    return {
      ok: false,
      output,
      totalTests,
      failureDetail: "full suite ran zero tests — a zero-test run is rejected",
    };
  }
  return { ok: true, output, totalTests, failureDetail: "" };
}

export function utcNow(): string {
  return new Date().toISOString();
}
