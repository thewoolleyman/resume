// The aggregate check — `bun run check` — per
// SPECIFICATION/non-functional-requirements.md §"Aggregate command": the
// single, non-mutating local quality gate. Gates are provisioned additively
// (§"Guardrail provisioning boundary"): each gate family activates when its
// artifact lands, not-yet-provisioned families are reported with the work
// item that provisions them, and artifacts that appear BEFORE their gate
// fail the check (fail-closed) so no present artifact is left unenforced.
//
// Exit codes per §"Exit-code baseline" (documented in scripts/README.md):
// 0 all operational gates pass; 1 a gate failed; 2 usage error;
// 3 precondition failure (no package.json at the project root).
//
// Usage: bun scripts/check.ts [--project-root <path>]
// Env: CHECK_SKIP_HARNESS_TESTS=1 skips the harness-tests gate (used by the
// harness tests themselves to avoid recursive `bun test scripts` runs).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

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

// Toolchain configuration artifacts whose verification gate arrives with
// li-tagohm — TypeScript, Svelte, lint, and format gates. If one of these
// appears before its gate, the check fails rather than silently ignoring it.
const UNGATED_TOOLCHAIN_ARTIFACTS: readonly string[] = [
  "tsconfig.json",
  "svelte.config.js",
  "svelte.config.ts",
  "vite.config.ts",
  "vite.config.js",
  "eslint.config.js",
  "eslint.config.ts",
  ".eslintrc",
  ".eslintrc.json",
  ".eslintrc.cjs",
  ".prettierrc",
  ".prettierrc.json",
  "prettier.config.js",
  "prettier.config.ts",
];

// Gate families that later guardrail slices provision. Reported on every
// run so the aggregate's current coverage is always visible.
const PENDING_GATES: readonly { family: string; workItem: string; title: string }[] = [
  {
    family: "typescript/svelte/lint/format",
    workItem: "li-tagohm",
    title: "TypeScript, Svelte, lint, and format gates",
  },
  {
    family: "tdd red->green branch-range validation",
    workItem: "li-avk7d7",
    title: "Content-triggered Red -> Green TDD commit gate",
  },
  {
    family: "local memory guardrail (check:memory)",
    workItem: "li-6b6u6m",
    title: "Local memory guardrail and discipline inventory",
  },
  {
    family: "ci delegation and workflow verification",
    workItem: "li-xjjeqo",
    title: "GitHub CI and pull-request automation",
  },
  {
    family: "result/rop enforcement (check:result)",
    workItem: "li-oaxjqm",
    title: "Result/ROP enforcement gate",
  },
  {
    family: "coverage and property/fuzz (test:coverage, test:property)",
    workItem: "li-m2trzv",
    title: "Coverage and property/fuzz gates",
  },
  {
    family: "scenario coverage (check:scenarios)",
    workItem: "li-hb77ad",
    title: "Scenario coverage gate",
  },
];

interface GateResult {
  readonly gate: string;
  readonly status: "ok" | "FAIL" | "skipped";
  readonly detail: string;
}

function parseProjectRoot(argv: readonly string[]): string {
  const flagIndex = argv.indexOf("--project-root");
  if (flagIndex === -1) {
    return process.cwd();
  }
  const value = argv[flagIndex + 1];
  if (value === undefined) {
    console.error("usage: bun scripts/check.ts [--project-root <path>]");
    process.exit(2);
  }
  return resolve(value);
}

interface PackageJson {
  readonly engines?: Record<string, string>;
  readonly scripts?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
}

function checkScriptSurface(root: string, pkg: PackageJson): GateResult {
  const failures: string[] = [];
  const scripts = pkg.scripts ?? {};
  const missing = REQUIRED_SCRIPTS.filter((name) => !(name in scripts));
  if (missing.length > 0) {
    failures.push(`missing required scripts: ${missing.join(", ")}`);
  }
  const bootstrap = scripts["bootstrap"] ?? "";
  if (!bootstrap.includes("bun install") || !bootstrap.includes("install-hooks")) {
    failures.push(
      "bootstrap must install pinned dependencies (bun install) and the committed hooks (install-hooks)",
    );
  }
  if (!existsSync(join(root, ".githooks"))) {
    failures.push("committed hooks directory .githooks/ is missing");
  }
  if (!/^\d+\.\d+\.\d+$/.test(pkg.engines?.["bun"] ?? "")) {
    failures.push("engines.bun must pin an exact Bun version");
  }
  const declared = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  // Anchored: the ENTIRE spec must be one exact version (optionally with
  // prerelease/build metadata) — a range that merely starts with an exact
  // version, e.g. "1.2.3 || 2.0.0", is not a pin.
  const ranged = Object.entries(declared)
    .filter(([, version]) => !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version))
    .map(([name]) => name);
  if (ranged.length > 0) {
    failures.push(`dependencies must be exactly pinned (no ranges): ${ranged.join(", ")}`);
  }
  return failures.length === 0
    ? { gate: "package-script surface", status: "ok", detail: "required scripts, bootstrap hook install, exact pins" }
    : { gate: "package-script surface", status: "FAIL", detail: failures.join("; ") };
}

function checkHarnessTests(root: string): GateResult {
  const gate = "harness tests (bun test scripts)";
  if (process.env["CHECK_SKIP_HARNESS_TESTS"] === "1") {
    return { gate, status: "skipped", detail: "CHECK_SKIP_HARNESS_TESTS=1 (nested invocation)" };
  }
  const scriptsDir = join(root, "scripts");
  const hasTests =
    existsSync(scriptsDir) &&
    readdirSync(scriptsDir).some((name) => name.endsWith(".test.ts"));
  if (!hasTests) {
    return { gate, status: "skipped", detail: "no scripts/*.test.ts present" };
  }
  const run = Bun.spawnSync({ cmd: ["bun", "test", "scripts"], cwd: root });
  if (run.exitCode !== 0) {
    const tail = run.stderr.toString().trim().split("\n").slice(-3).join(" | ");
    return { gate, status: "FAIL", detail: tail };
  }
  return { gate, status: "ok", detail: "all harness tests pass" };
}

function checkNoUngatedToolchainConfig(root: string): GateResult {
  const gate = "toolchain-config additivity guard";
  const present = UNGATED_TOOLCHAIN_ARTIFACTS.filter((name) =>
    existsSync(join(root, name)),
  );
  if (present.length > 0) {
    return {
      gate,
      status: "FAIL",
      detail:
        `toolchain configuration present before its gate: ${present.join(", ")} — ` +
        "provision the verification gate in the same change (li-tagohm — TypeScript, Svelte, lint, and format gates)",
    };
  }
  return { gate, status: "ok", detail: "no ungated toolchain configuration present" };
}

function checkNoPrematureProductSource(root: string): GateResult {
  const gate = "product-source boundary guard";
  const srcDir = join(root, "src");
  if (existsSync(srcDir) && readdirSync(srcDir).length > 0) {
    return {
      gate,
      status: "FAIL",
      detail:
        "first-party product source under src/** is present before the guardrail " +
        "harness is complete (SPECIFICATION/non-functional-requirements.md " +
        '§"Guardrail provisioning boundary"). The gate that relaxes this lands ' +
        "with li-eg4w7j — green precondition for product work.",
    };
  }
  return { gate, status: "ok", detail: "no src/** product source before guardrail completion" };
}

const root = parseProjectRoot(process.argv.slice(2));
const packageJsonPath = join(root, "package.json");
if (!existsSync(packageJsonPath)) {
  console.error(`precondition failure: no package.json at ${root}`);
  process.exit(3);
}
const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;

const results: GateResult[] = [
  checkScriptSurface(root, pkg),
  checkHarnessTests(root),
  checkNoUngatedToolchainConfig(root),
  checkNoPrematureProductSource(root),
];

console.log("aggregate check (bun run check) — operational gates:");
for (const result of results) {
  console.log(`  [${result.status}] ${result.gate} — ${result.detail}`);
}
console.log("not-yet-provisioned gate families (additive provisioning):");
for (const pending of PENDING_GATES) {
  console.log(`  [pending] ${pending.family} — arrives with ${pending.workItem} (${pending.title})`);
}

const failed = results.filter((result) => result.status === "FAIL");
if (failed.length > 0) {
  console.error(`aggregate check FAILED: ${failed.map((f) => f.gate).join(", ")}`);
  process.exit(1);
}
console.log("aggregate check passed (operational gates green).");
