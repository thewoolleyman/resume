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
// Env (all used by the harness self-tests to avoid recursion / heavy runs;
// never a silent bypass — each prints a [skipped] gate line):
//   CHECK_SKIP_HARNESS_TESTS=1   skip the harness-tests gate (recursion guard)
//   CHECK_SKIP_TOOLCHAIN_RUNNERS=1 skip typecheck/lint/format:check runners
//   CHECK_SKIP_BUILD=1           skip the SvelteKit production build gate
//   CHECK_SKIP_E2E=1             skip the Playwright end-to-end gate
//   CHECK_SKIP_COVERAGE=1        skip the coverage gate (its nested vitest
//                                --coverage write to the shared coverage/ dir
//                                would clobber concurrent operational self-tests)

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { verifyCiProvisioning, verifyLiveGitHubSettings } from "./check-ci";
import { checkComments } from "./check-comments";
import {
  INVENTORY_PATH,
  verifyDisciplineInventory,
} from "./check-discipline-inventory";
import { checkNoGitJsonl } from "./check-no-git-jsonl";
import {
  COVERAGE_PATH as SCENARIO_COVERAGE_PATH,
  SCENARIOS_PATH,
  verifyScenarios,
} from "./check-scenarios";

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
// run so the aggregate's current coverage is always visible. Empty now that
// the scenario coverage gate is operational — every guardrail
// gate family is provisioned.
const PENDING_GATES: readonly {
  family: string;
  workItem: string;
  title: string;
}[] = [];

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
    // Bun's test runner writes results to stderr. Surface the failing test
    // names — the `(fail) …` lines — plus the summary tail, so a harness
    // failure names the culprit instead of only reporting a count.
    const lines = run.stderr.toString().trim().split("\n");
    const failing = lines.filter((line) => line.includes("(fail)"));
    const detailLines =
      failing.length > 0 ? [...failing, ...lines.slice(-1)] : lines.slice(-3);
    return { gate, status: "FAIL", detail: detailLines.join(" | ") };
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
    // mentioning a removed entry cannot satisfy it. Effective
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
    // Effective-severity verification: resolve the config the
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

// Runs the SvelteKit + Vercel-adapter production build through the named
// `build` script (§"Release and Vercel promotion discipline" /
// constraints.md §"Framework and deployment"): the aggregate check must
// exercise the real production build path, not merely assert the script
// exists. Skipped for nested harness invocations (CHECK_SKIP_BUILD=1) and
// while `build` is still a not-yet-provisioned stub.
// A tree is "provisioned" for the build/e2e gates once it carries first-party
// product source under src/** or SvelteKit scaffold artifacts. In such a tree a
// not-yet-provisioned build/e2e stub is a REGRESSION that must fail-close, not a
// pre-scaffold armed state — otherwise reverting a real runner to a stub would
// silently launder the top-of-pyramid gate.
function isProvisionedTree(root: string): boolean {
  const srcDir = join(root, "src");
  const srcPresent = existsSync(srcDir) && readdirSync(srcDir).length > 0;
  return srcPresent || existsSync(join(root, "svelte.config.js"));
}

function checkProductionBuild(root: string, pkg: PackageJson): GateResult {
  const gate = "production build (bun run build)";
  if (process.env["CHECK_SKIP_BUILD"] === "1") {
    return {
      gate,
      status: "skipped",
      detail: "CHECK_SKIP_BUILD=1 (nested invocation)",
    };
  }
  const script = pkg.scripts?.["build"] ?? "";
  if (script.includes("not-yet-provisioned")) {
    if (isProvisionedTree(root)) {
      return {
        gate,
        status: "FAIL",
        detail:
          "build is a not-yet-provisioned stub while product source / SvelteKit artifacts exist — the production build gate must run the real Vercel-adapter build",
      };
    }
    return {
      gate,
      status: "skipped",
      detail: "build not yet provisioned in this tree",
    };
  }
  const run = Bun.spawnSync({ cmd: ["bun", "run", "build"], cwd: root });
  if (run.exitCode !== 0) {
    const tail = (run.stdout.toString() + run.stderr.toString())
      .trim()
      .split("\n")
      .slice(-4)
      .join(" | ");
    return { gate, status: "FAIL", detail: `bun run build failed: ${tail}` };
  }
  return {
    gate,
    status: "ok",
    detail: "SvelteKit production build succeeds through the Vercel adapter",
  };
}

// Runs the Playwright end-to-end suite through the named `test:e2e` script
// (§"Top-of-pyramid discipline" / §"Definition of done for implementation
// work"): the aggregate check must actually RUN the browser-observable
// top-of-pyramid tests, not merely resolve their mapped identifiers. Skipped
// for nested harness invocations (CHECK_SKIP_E2E=1) and while `test:e2e` is
// still a not-yet-provisioned stub.
function checkE2e(root: string, pkg: PackageJson): GateResult {
  const gate = "end-to-end tests (bun run test:e2e)";
  if (process.env["CHECK_SKIP_E2E"] === "1") {
    return {
      gate,
      status: "skipped",
      detail: "CHECK_SKIP_E2E=1 (nested invocation)",
    };
  }
  const script = pkg.scripts?.["test:e2e"] ?? "";
  if (script.includes("not-yet-provisioned")) {
    if (isProvisionedTree(root)) {
      return {
        gate,
        status: "FAIL",
        detail:
          "test:e2e is a not-yet-provisioned stub while product source / SvelteKit artifacts exist — the top-of-pyramid Playwright gate must run for real",
      };
    }
    return {
      gate,
      status: "skipped",
      detail: "test:e2e not yet provisioned in this tree",
    };
  }
  const run = Bun.spawnSync({ cmd: ["bun", "run", "test:e2e"], cwd: root });
  if (run.exitCode !== 0) {
    const tail = (run.stdout.toString() + run.stderr.toString())
      .trim()
      .split("\n")
      .slice(-4)
      .join(" | ");
    return { gate, status: "FAIL", detail: `bun run test:e2e failed: ${tail}` };
  }
  return {
    gate,
    status: "ok",
    detail: "Playwright end-to-end scenarios pass against the built app",
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

// Verifies the primary-checkout commit-refuse hook is installed (§"Hooks" /
// §"Pull request landing automation", worktree-mandatory):
// `.githooks/pre-commit` MUST invoke scripts/check-primary-checkout.ts so a
// commit authored in the primary checkout — rather than a secondary worktree
// — is refused. `bun run check` MUST fail when that wiring is absent, so a
// bypassed or uninstalled hook is still caught. Verified in-process (reading
// the committed hook) rather than via a package script, so a no-op stub cannot
// launder the gate.
function checkPrimaryCheckoutHook(root: string): GateResult {
  const gate = "primary-checkout commit-refuse hook (.githooks/pre-commit)";
  const preCommit = join(root, ".githooks", "pre-commit");
  if (!existsSync(preCommit)) {
    return {
      gate,
      status: "FAIL",
      detail:
        ".githooks/pre-commit is missing — the worktree-mandatory commit-refuse hook is not installed",
    };
  }
  if (!readFileSync(preCommit, "utf8").includes("check-primary-checkout.ts")) {
    return {
      gate,
      status: "FAIL",
      detail:
        ".githooks/pre-commit does not invoke scripts/check-primary-checkout.ts — a commit in the primary checkout would not be refused",
    };
  }
  return {
    gate,
    status: "ok",
    detail:
      "pre-commit invokes the commit-refuse gate; primary-checkout commits are refused",
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

// Runs the Result/ROP discipline gate through its named script
// (§"Result and railway-oriented programming discipline"): AST checks over
// first-party src/** (armed-but-vacuous until product source lands) plus
// effective enablement of the type-aware ESLint result rules.
function checkResultDiscipline(root: string, pkg: PackageJson): GateResult {
  const gate = "result/rop enforcement (check:result)";
  if (!("check:result" in (pkg.scripts ?? {}))) {
    return {
      gate,
      status: "FAIL",
      detail: "package.json has no check:result script",
    };
  }
  const run = Bun.spawnSync({ cmd: ["bun", "run", "check:result"], cwd: root });
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
      "Result/DomainError discipline verified (AST checks armed over src/**, ESLint result rules effective)",
  };
}

// Verifies the CI workflows, named-script delegation, and the documented
// branch-protection/merge-method settings (§"GitHub CI and pull request
// discipline", §"Pull request landing automation"). Local verification
// always runs; live GitHub API verification joins when CHECK_LIVE_GITHUB=1
// and gh credentials are available (the spec makes live checks optional).
function checkCiProvisioning(root: string): GateResult {
  const gate = "ci delegation and workflow verification (.github/workflows)";
  const result = verifyCiProvisioning(root);
  if (result.status === "absent") {
    const srcDir = join(root, "src");
    if (existsSync(srcDir) && readdirSync(srcDir).length > 0) {
      return {
        gate,
        status: "FAIL",
        detail:
          ".github/workflows/ is missing while first-party product source under src/** is present — CI and PR automation are required before the first non-trivial implementation merge",
      };
    }
    return {
      gate,
      status: "skipped",
      detail: "CI workflows not provisioned in this tree (no src/** yet)",
    };
  }
  const failures = [...result.failures];
  if (process.env["CHECK_LIVE_GITHUB"] === "1") {
    failures.push(...verifyLiveGitHubSettings(root));
  }
  if (failures.length > 0) {
    return { gate, status: "FAIL", detail: failures.join("; ") };
  }
  return {
    gate,
    status: "ok",
    detail:
      "check.yml, auto-enable-merge.yml, named-script delegation, and settings documentation verified",
  };
}

// Runs the coverage gate through its named script (§"Test coverage
// expectations"): the committed coverage thresholds must stay at 100%
// line/branch and every first-party src/** file in any present coverage
// report must be at 100% (armed-but-vacuous until product source and a
// coverage report land).
function checkCoverage(root: string, pkg: PackageJson): GateResult {
  const gate = "coverage thresholds (test:coverage)";
  if (process.env["CHECK_SKIP_COVERAGE"] === "1") {
    return {
      gate,
      status: "skipped",
      detail: "CHECK_SKIP_COVERAGE=1 (nested invocation)",
    };
  }
  if (!("test:coverage" in (pkg.scripts ?? {}))) {
    return {
      gate,
      status: "FAIL",
      detail: "package.json has no test:coverage script",
    };
  }
  const run = Bun.spawnSync({
    cmd: ["bun", "run", "test:coverage"],
    cwd: root,
  });
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
      "committed thresholds pinned at 100% line/branch; per-file src/** coverage floor armed",
  };
}

// Runs the property/fuzz reproducibility gate through its named script
// (§"Fuzzing and property checks"): the committed reproducibility metadata
// (runner, seed, run counts, replay command, shrink capture, generator
// classes) must be present and well-formed (armed-but-vacuous until src/**
// property targets land).
function checkProperty(root: string, pkg: PackageJson): GateResult {
  const gate = "property/fuzz reproducibility (test:property)";
  if (!("test:property" in (pkg.scripts ?? {}))) {
    return {
      gate,
      status: "FAIL",
      detail: "package.json has no test:property script",
    };
  }
  const run = Bun.spawnSync({
    cmd: ["bun", "run", "test:property"],
    cwd: root,
  });
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
      "reproducibility metadata verified (fast-check runner, seed, run counts, replay, shrink capture, generator classes)",
  };
}

// Verifies the scenario coverage mapping IN-PROCESS (§"Top-of-pyramid
// discipline"), like the discipline-inventory and CI gates. It runs
// verifyScenarios directly rather than the check:scenarios package script, so
// a no-op script (e.g. "check:scenarios": "true") cannot launder the gate —
// the aggregate always validates the committed mapping itself. The committed
// scenario-coverage.json is the provisioning artifact: a tree without it is
// unprovisioned UNLESS it already carries the scenarios spec or src/** product
// source, in which case the missing mapping fail-closes. (The real repo always
// carries SPECIFICATION/scenarios.md, so it can never reach the skipped path —
// a deleted mapping there fails; only a bare synthetic fixture is skipped.)
function checkScenarios(root: string): GateResult {
  const gate = "scenario coverage (check:scenarios)";
  if (!existsSync(join(root, SCENARIO_COVERAGE_PATH))) {
    const specExists = existsSync(join(root, SCENARIOS_PATH));
    const srcDir = join(root, "src");
    const srcPresent = existsSync(srcDir) && readdirSync(srcDir).length > 0;
    if (specExists || srcPresent) {
      return {
        gate,
        status: "FAIL",
        detail: `${SCENARIO_COVERAGE_PATH} is missing while ${
          specExists ? SCENARIOS_PATH : "src/** product source"
        } is present — the committed scenario coverage mapping is required`,
      };
    }
    return {
      gate,
      status: "skipped",
      detail: "scenario coverage mapping not provisioned in this tree",
    };
  }
  const { failures, armed, counts } = verifyScenarios(root);
  if (failures.length > 0) {
    const shown = failures.slice(0, 3).join("; ");
    const more =
      failures.length > 3 ? ` (+${String(failures.length - 3)} more)` : "";
    return { gate, status: "FAIL", detail: shown + more };
  }
  const summary = `${String(counts.browserObservable)} browser-observable, ${String(counts.nonBrowser)} non-browser-exercisable`;
  return {
    gate,
    status: "ok",
    detail: armed
      ? `${summary}; every load-bearing scenario classified and mapped (verified in-process); identifier resolution armed until src/** lands`
      : `${summary}; every load-bearing scenario mapped and every identifier resolves to an executable test`,
  };
}

// The no-live-git-jsonl gate: after the
// work-item orchestrator migrated to livespec-orchestrator-beads-fabro, no
// live reference to the retired git-jsonl orchestrator may remain in the
// tracked tree (migration-history locations are excluded — see
// scripts/check-no-git-jsonl.ts). Skips gracefully when git is unavailable.
function checkNoGitJsonlReferences(root: string): GateResult {
  const gate = "no-live-git-jsonl (orchestrator migration)";
  let result;
  try {
    result = checkNoGitJsonl(root);
  } catch (error) {
    return {
      gate,
      status: "skipped",
      detail: `git unavailable: ${(error as Error).message}`,
    };
  }
  if (!result.ok) {
    return {
      gate,
      status: "FAIL",
      detail:
        `${String(result.violations.length)} live git-jsonl reference(s): ` +
        result.violations.slice(0, 5).join("; "),
    };
  }
  return {
    gate,
    status: "ok",
    detail:
      "no live git-jsonl reference in the tracked tree — beads-fabro is the orchestrator",
  };
}

// Comment-discipline gate per §"Comment discipline": in-scope source comments
// carry no rotting historical-bookkeeping references. Skips when git is
// unavailable (the scan uses git ls-files).
function checkCommentDiscipline(root: string): GateResult {
  const gate = "comment discipline (no rotting references)";
  let result;
  try {
    result = checkComments(root);
  } catch (error) {
    return {
      gate,
      status: "skipped",
      detail: `git unavailable: ${(error as Error).message}`,
    };
  }
  if (!result.ok) {
    return {
      gate,
      status: "FAIL",
      detail:
        `${String(result.violations.length)} rotting reference(s) in source comments: ` +
        result.violations
          .slice(0, 5)
          .map((v) => `${v.file}:${String(v.line)} (${v.marker})`)
          .join("; "),
    };
  }
  return {
    gate,
    status: "ok",
    detail: "no historical-bookkeeping references in in-scope source comments",
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
  checkProductionBuild(root, pkg),
  checkTddBranchRange(root),
  checkMemoryGuardrail(root, pkg),
  checkPrimaryCheckoutHook(root),
  checkDisciplineInventory(root),
  checkCiProvisioning(root),
  checkResultDiscipline(root, pkg),
  checkCoverage(root, pkg),
  checkProperty(root, pkg),
  checkScenarios(root),
  checkE2e(root, pkg),
  checkNoGitJsonlReferences(root),
  checkCommentDiscipline(root),
];

console.log("aggregate check (bun run check) — operational gates:");
for (const result of results) {
  console.log(`  [${result.status}] ${result.gate} — ${result.detail}`);
}
if (PENDING_GATES.length > 0) {
  console.log("not-yet-provisioned gate families (additive provisioning):");
  for (const pending of PENDING_GATES) {
    console.log(
      `  [pending] ${pending.family} — arrives with ${pending.workItem} (${pending.title})`,
    );
  }
} else {
  console.log(
    "not-yet-provisioned gate families: none — every guardrail gate is operational.",
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
