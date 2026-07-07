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

import {
  INVENTORY_PATH,
  verifyDisciplineInventory,
} from "./check-discipline-inventory";

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

// The five TypeScript strictness flags the committed configuration must
// enable per §"TypeScript quality gates".
const REQUIRED_TS_FLAGS = [
  "strict",
  "noImplicitOverride",
  "noUncheckedIndexedAccess",
  "exactOptionalPropertyTypes",
  "useUnknownInCatchVariables",
] as const;

// Gate families that later guardrail slices provision. Reported on every
// run so the aggregate's current coverage is always visible.
const PENDING_GATES: readonly {
  family: string;
  workItem: string;
  title: string;
}[] = [
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
  if (
    !bootstrap.includes("bun install") ||
    !bootstrap.includes("install-hooks")
  ) {
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
  const declared = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };
  // Anchored: the ENTIRE spec must be one exact version (optionally with
  // prerelease/build metadata) — a range that merely starts with an exact
  // version, e.g. "1.2.3 || 2.0.0", is not a pin.
  const ranged = Object.entries(declared)
    .filter(
      ([, version]) => !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version),
    )
    .map(([name]) => name);
  if (ranged.length > 0) {
    failures.push(
      `dependencies must be exactly pinned (no ranges): ${ranged.join(", ")}`,
    );
  }
  return failures.length === 0
    ? {
        gate: "package-script surface",
        status: "ok",
        detail: "required scripts, bootstrap hook install, exact pins",
      }
    : {
        gate: "package-script surface",
        status: "FAIL",
        detail: failures.join("; "),
      };
}

function checkHarnessTests(root: string): GateResult {
  const gate = "harness tests (bun test scripts)";
  if (process.env["CHECK_SKIP_HARNESS_TESTS"] === "1") {
    return {
      gate,
      status: "skipped",
      detail: "CHECK_SKIP_HARNESS_TESTS=1 (nested invocation)",
    };
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

// Removes JS line and block comments while preserving string and template
// literals, so the rule-family scan below cannot be satisfied by a comment
// that merely mentions a removed rule. Not a full JS parser — regex literals
// containing "//" inside character classes are out of scope for the config
// files this scans.
function stripJsComments(source: string): string {
  type Mode = "block" | "code" | "double" | "line" | "single" | "template";
  let mode: Mode = "code";
  let out = "";
  let i = 0;
  while (i < source.length) {
    const ch = source.charAt(i);
    const next = source.charAt(i + 1);
    if (mode === "code") {
      if (ch === "/" && next === "/") {
        mode = "line";
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        mode = "block";
        i += 2;
        continue;
      }
      if (ch === "'") mode = "single";
      else if (ch === '"') mode = "double";
      else if (ch === "`") mode = "template";
      out += ch;
      i += 1;
      continue;
    }
    if (mode === "line") {
      if (ch === "\n") {
        mode = "code";
        out += ch;
      }
      i += 1;
      continue;
    }
    if (mode === "block") {
      if (ch === "*" && next === "/") {
        mode = "code";
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    // Inside a string or template literal: copy verbatim, honoring escapes.
    out += ch;
    if (ch === "\\") {
      out += next;
      i += 2;
      continue;
    }
    if (
      (mode === "single" && ch === "'") ||
      (mode === "double" && ch === '"') ||
      (mode === "template" && ch === "`")
    ) {
      mode = "code";
    }
    i += 1;
  }
  return out;
}

// The rules that must be effectively enabled at error severity for
// TypeScript sources: a sentinel from the strict-type-checked preset, the
// import-order rule, the Svelte compiler/accessibility diagnostics rule, and
// the first-party import-boundary rule.
const REQUIRED_ERROR_RULES: readonly [string, string][] = [
  [
    "@typescript-eslint/no-floating-promises",
    "typescript-eslint strict-type-checked (type-aware) baseline",
  ],
  ["perfectionist/sort-imports", "import-order rules"],
  ["svelte/valid-compile", "Svelte compiler (incl. accessibility) diagnostics"],
  ["no-restricted-imports", "first-party import-boundary rules"],
];

function isErrorSeverity(entry: unknown): boolean {
  const severity = Array.isArray(entry) ? (entry as unknown[])[0] : entry;
  return severity === 2 || severity === "error";
}

function verifyEffectiveEslintRules(root: string): string[] {
  const probe = "eslint-baseline-probe.ts";
  const run = Bun.spawnSync({
    cmd: ["bunx", "eslint", "--print-config", probe],
    cwd: root,
  });
  if (run.exitCode !== 0) {
    const tail = (run.stdout.toString() + run.stderr.toString())
      .trim()
      .split("\n")
      .slice(-2)
      .join(" | ");
    return [`eslint --print-config failed to resolve the config: ${tail}`];
  }
  let rules: Record<string, unknown>;
  try {
    const parsed = JSON.parse(run.stdout.toString()) as {
      rules?: Record<string, unknown>;
    };
    rules = parsed.rules ?? {};
  } catch {
    return ["eslint --print-config emitted unparseable output"];
  }
  const failures: string[] = [];
  for (const [rule, family] of REQUIRED_ERROR_RULES) {
    if (!isErrorSeverity(rules[rule])) {
      failures.push(
        `effective ESLint config must enable "${rule}" at error severity (${family})`,
      );
    }
  }
  return failures;
}

// Validates TDD evidence over origin/master..HEAD via the range validator
// (scripts/tdd-range-check.ts), so rebases, squashes, and --no-verify
// commits cannot launder product source past the commit-msg hook.
function checkTddBranchRange(root: string): GateResult {
  const gate = "tdd branch-range validation (origin/master..HEAD)";
  if (!existsSync(join(root, ".git"))) {
    return { gate, status: "skipped", detail: "not a git repository" };
  }
  const validator = join(root, "scripts", "tdd-range-check.ts");
  if (!existsSync(validator)) {
    return {
      gate,
      status: "FAIL",
      detail:
        "scripts/tdd-range-check.ts is missing while the repository is a git tree",
    };
  }
  const run = Bun.spawnSync({ cmd: ["bun", validator], cwd: root });
  if (run.exitCode !== 0) {
    const tail = (run.stdout.toString() + run.stderr.toString())
      .trim()
      .split("\n")
      .slice(-4)
      .join(" | ");
    return { gate, status: "FAIL", detail: tail };
  }
  return {
    gate,
    status: "ok",
    detail: "all product-source commits in range carry valid TDD evidence",
  };
}

// Static verification that the committed toolchain configuration is at the
// pinned baseline — §"TypeScript quality gates" requires the aggregate check
// to fail when the configuration drops below it. Activation is keyed on
// tsconfig.json; a tree whose package.json declares typescript without a
// tsconfig is a weakened baseline, not an unprovisioned one.
function checkToolchainBaseline(root: string, pkg: PackageJson): GateResult {
  const gate = "toolchain configuration baseline";
  const tsconfigPath = join(root, "tsconfig.json");
  const declaresTypescript =
    "typescript" in
    { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  if (!existsSync(tsconfigPath)) {
    if (declaresTypescript) {
      return {
        gate,
        status: "FAIL",
        detail: "typescript is a dependency but tsconfig.json is missing",
      };
    }
    return {
      gate,
      status: "skipped",
      detail: "toolchain not provisioned in this tree",
    };
  }
  const failures: string[] = [];
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8")) as {
    compilerOptions?: Record<string, unknown>;
  };
  const missingFlags = REQUIRED_TS_FLAGS.filter(
    (flag) => tsconfig.compilerOptions?.[flag] !== true,
  );
  if (missingFlags.length > 0) {
    failures.push(`tsconfig.json must enable: ${missingFlags.join(", ")}`);
  }
  const scripts = pkg.scripts ?? {};
  const requiredScriptContents: readonly [string, string][] = [
    ["typecheck", "tsc"],
    ["typecheck", "svelte-check"],
    ["lint", "eslint"],
    ["lint", "--max-warnings 0"],
    ["lint:fix", "--fix"],
    ["format:check", "prettier --check"],
    ["format", "prettier --write"],
  ];
  for (const [script, needle] of requiredScriptContents) {
    if (!(scripts[script] ?? "").includes(needle)) {
      failures.push(`${script} script must include "${needle}"`);
    }
  }
  const eslintConfigPath = join(root, "eslint.config.js");
  if (!existsSync(eslintConfigPath)) {
    failures.push("eslint.config.js is missing");
  } else {
    // Presence scan for preset/plugin wiring, comment-stripped so a comment
    // mentioning a removed entry cannot satisfy it (li-mhwzqt). Effective
    // enablement is verified separately below.
    const eslintConfig = stripJsComments(
      readFileSync(eslintConfigPath, "utf8"),
    );
    const requiredRuleFamilies: readonly [string, string][] = [
      ["strictTypeChecked", "typescript-eslint strict-type-checked baseline"],
      ["eslint-plugin-svelte", "Svelte-aware linting"],
      ["eslint-config-prettier", "Prettier compatibility"],
    ];
    for (const [needle, family] of requiredRuleFamilies) {
      if (!eslintConfig.includes(needle)) {
        failures.push(`eslint.config.js must retain ${family} ("${needle}")`);
      }
    }
    // Effective-severity verification (li-mhwzqt): resolve the config the
    // way ESLint itself does and require the load-bearing rules to be
    // enabled at error severity for TypeScript sources — a rule that is
    // absent, 'off', 'warn', or overridden to 'off' by a later flat-config
    // block fails here by name. The probe path is virtual; --print-config
    // only needs it to match the config's file patterns.
    failures.push(...verifyEffectiveEslintRules(root));
  }
  if (!existsSync(join(root, ".prettierrc.json"))) {
    failures.push(".prettierrc.json is missing");
  }
  return failures.length === 0
    ? {
        gate,
        status: "ok",
        detail:
          "strict TS flags, lint rule families, format config at baseline",
      }
    : { gate, status: "FAIL", detail: failures.join("; ") };
}

// Runs the provisioned toolchain gates through their named scripts (CI
// delegation-friendly). Skipped for nested invocations from the harness
// tests, which exercise these scripts directly.
function checkToolchainRunners(root: string): GateResult {
  const gate = "toolchain runners (typecheck, lint, format:check)";
  if (process.env["CHECK_SKIP_TOOLCHAIN_RUNNERS"] === "1") {
    return {
      gate,
      status: "skipped",
      detail: "CHECK_SKIP_TOOLCHAIN_RUNNERS=1 (nested invocation)",
    };
  }
  if (!existsSync(join(root, "tsconfig.json"))) {
    return {
      gate,
      status: "skipped",
      detail: "toolchain not provisioned in this tree",
    };
  }
  for (const script of ["typecheck", "lint", "format:check"]) {
    const run = Bun.spawnSync({ cmd: ["bun", "run", script], cwd: root });
    if (run.exitCode !== 0) {
      const tail = (run.stdout.toString() + run.stderr.toString())
        .trim()
        .split("\n")
        .slice(-3)
        .join(" | ");
      return {
        gate,
        status: "FAIL",
        detail: `bun run ${script} failed: ${tail}`,
      };
    }
  }
  return {
    gate,
    status: "ok",
    detail: "typecheck, lint, and format:check pass",
  };
}

// Runs the local memory guardrail through its named script (CI-delegation
// friendly) — the SAME guard the bootstrap-installed .githooks/pre-commit
// hook runs on the staged tree, so a bypassed or uninstalled hook is still
// caught here (§"Local memory guardrails").
function checkMemoryGuardrail(root: string, pkg: PackageJson): GateResult {
  const gate = "local memory guardrail (check:memory)";
  if (!("check:memory" in (pkg.scripts ?? {}))) {
    return {
      gate,
      status: "FAIL",
      detail: "package.json has no check:memory script",
    };
  }
  const run = Bun.spawnSync({ cmd: ["bun", "run", "check:memory"], cwd: root });
  if (run.exitCode !== 0) {
    const tail = (run.stdout.toString() + run.stderr.toString())
      .trim()
      .split("\n")
      .slice(-6)
      .join(" | ");
    return { gate, status: "FAIL", detail: tail };
  }
  return {
    gate,
    status: "ok",
    detail:
      "no prohibited memory paths; .ai notes indexed from AGENTS.md with no dangling references",
  };
}

// Verifies the discipline-adoption inventory (§"Discipline adoption
// inventory") in-process. A tree without the inventory is unprovisioned
// UNLESS it already carries src/** product source — the inventory is
// required before the first non-trivial implementation merge, so that
// combination fail-closes.
function checkDisciplineInventory(root: string): GateResult {
  const gate = `discipline-adoption inventory (${INVENTORY_PATH})`;
  const result = verifyDisciplineInventory(root);
  if (result.status === "absent") {
    const srcDir = join(root, "src");
    if (existsSync(srcDir) && readdirSync(srcDir).length > 0) {
      return {
        gate,
        status: "FAIL",
        detail: `${INVENTORY_PATH} is missing while first-party product source under src/** is present — the inventory is required before the first non-trivial implementation merge`,
      };
    }
    return {
      gate,
      status: "skipped",
      detail: "inventory not provisioned in this tree (no src/** yet)",
    };
  }
  if (result.failures.length > 0) {
    return { gate, status: "FAIL", detail: result.failures.join("; ") };
  }
  return {
    gate,
    status: "ok",
    detail:
      "baseline rows, dispositions, enforcement classes, and citations verified",
  };
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
  return {
    gate,
    status: "ok",
    detail: "no src/** product source before guardrail completion",
  };
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
  checkToolchainBaseline(root, pkg),
  checkToolchainRunners(root),
  checkTddBranchRange(root),
  checkMemoryGuardrail(root, pkg),
  checkDisciplineInventory(root),
  checkNoPrematureProductSource(root),
];

console.log("aggregate check (bun run check) — operational gates:");
for (const result of results) {
  console.log(`  [${result.status}] ${result.gate} — ${result.detail}`);
}
console.log("not-yet-provisioned gate families (additive provisioning):");
for (const pending of PENDING_GATES) {
  console.log(
    `  [pending] ${pending.family} — arrives with ${pending.workItem} (${pending.title})`,
  );
}

const failed = results.filter((result) => result.status === "FAIL");
if (failed.length > 0) {
  console.error(
    `aggregate check FAILED: ${failed.map((f) => f.gate).join(", ")}`,
  );
  process.exit(1);
}
console.log("aggregate check passed (operational gates green).");
