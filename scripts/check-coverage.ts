// The coverage gate — `bun run test:coverage` — per
// SPECIFICATION/non-functional-requirements.md §"Test coverage
// expectations". Standalone Bun/TypeScript (no external enforcement suite
// per constraints.md §"Standalone boundary"). Two enforced things:
//
// 1. The committed coverage thresholds (coverage.config.json — the source
//    of truth, kept SEPARATE from this gate so lowering it below 100% is
//    caught by an unchanged gate) must be 100% line and 100% branch. Per
//    the spec this is non-negotiable: first-party product source under
//    src/** admits no lower tier, no framework-glue exemption, and no
//    per-module carve-out. Function and statement thresholds are enforced
//    at 100% too (subsumed by 100% line, but pinned so the config cannot
//    drift).
// 2. When a coverage report (coverage/coverage-summary.json, the Istanbul
//    json-summary shape a `vitest run --coverage` produces) is present,
//    every first-party src/** source file in it must be at 100% line and
//    100% branch. A single under-covered src/** file fails the gate.
//
// With no coverage report and no src/** the gate is ARMED: the committed
// threshold floor is still enforced, and the per-file check activates the
// moment a report and product source exist (additive provisioning, no
// bootstrap window). Coverage/ is gitignored, so the per-file check is
// dormant on a clean checkout and runs against a freshly produced report.
//
// When the Vitest toolchain lands, `test:coverage` becomes
// `vitest run --coverage && bun scripts/check-coverage.ts`: Vitest produces
// the report and enforces the global thresholds from coverage.config.json,
// and this gate enforces the per-file 100% floor plus the committed
// threshold floor. See scripts/README.md §"Coverage gate".
//
// Exit codes per §"Exit-code baseline": 0 ok/armed, 1 violations, 2 usage.

import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

export const COVERAGE_CONFIG_PATH = "coverage.config.json";
const COVERAGE_SUMMARY_PATH = "coverage/coverage-summary.json";

// Line and branch are the spec-mandated non-negotiable thresholds; function
// and statement are pinned too so the committed config cannot quietly drop
// a metric.
const REQUIRED_THRESHOLDS = [
  "lines",
  "branches",
  "functions",
  "statements",
] as const;

// Per-file enforcement is line + branch: the two metrics the spec names for
// the per-file 100% floor.
const PER_FILE_METRICS = ["lines", "branches"] as const;

export interface CoverageVerification {
  readonly failures: readonly string[];
  readonly measuredFiles: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

// True when a coverage-summary key names a first-party src/** source file.
// Report keys are usually absolute paths; relativize against the project
// root and accept anything under src/ (test artifacts never reach the
// report because the future Vitest config scopes collection to src/**).
function isFirstPartySource(root: string, key: string): boolean {
  const rel = relative(root, resolve(root, key));
  return rel === "src" || rel.startsWith(`src/`);
}

function metricPct(entry: unknown, metric: string): number | null {
  const metricRecord = asRecord(asRecord(entry)?.[metric]);
  const pct = metricRecord?.["pct"];
  return typeof pct === "number" ? pct : null;
}

export function verifyCoverage(root: string): CoverageVerification {
  const failures: string[] = [];

  const configPath = resolve(root, COVERAGE_CONFIG_PATH);
  if (!existsSync(configPath)) {
    failures.push(
      `${COVERAGE_CONFIG_PATH} is missing — the committed coverage thresholds must document 100% line and 100% branch for first-party src/**`,
    );
    return { failures, measuredFiles: 0 };
  }

  let config: Record<string, unknown> | null;
  try {
    config = asRecord(readJson(configPath));
  } catch {
    return {
      failures: [`${COVERAGE_CONFIG_PATH} is not valid JSON`],
      measuredFiles: 0,
    };
  }
  if (config === null) {
    return {
      failures: [`${COVERAGE_CONFIG_PATH} must be a JSON object of thresholds`],
      measuredFiles: 0,
    };
  }
  for (const metric of REQUIRED_THRESHOLDS) {
    const value = config[metric];
    if (typeof value !== "number") {
      failures.push(
        `${COVERAGE_CONFIG_PATH} must set a numeric "${metric}" threshold`,
      );
    } else if (value < 100) {
      failures.push(
        `${COVERAGE_CONFIG_PATH} sets "${metric}" to ${String(value)} — first-party src/** coverage must be 100% (100% line and 100% branch is non-negotiable)`,
      );
    }
  }

  let measuredFiles = 0;
  const summaryPath = resolve(root, COVERAGE_SUMMARY_PATH);
  if (existsSync(summaryPath)) {
    let summary: Record<string, unknown> | null;
    try {
      summary = asRecord(readJson(summaryPath));
    } catch {
      return {
        failures: [...failures, `${COVERAGE_SUMMARY_PATH} is not valid JSON`],
        measuredFiles: 0,
      };
    }
    if (summary === null) {
      failures.push(`${COVERAGE_SUMMARY_PATH} must be a JSON object`);
    } else {
      for (const [key, entry] of Object.entries(summary)) {
        if (key === "total" || !isFirstPartySource(root, key)) {
          continue;
        }
        measuredFiles += 1;
        const relKey = relative(root, resolve(root, key));
        for (const metric of PER_FILE_METRICS) {
          const pct = metricPct(entry, metric);
          if (pct === null) {
            failures.push(
              `${relKey}: coverage report has no numeric ${metric} pct`,
            );
          } else if (pct < 100) {
            failures.push(
              `${relKey}: ${metric} coverage is ${String(pct)}% — first-party src/** source must be 100% ${metric}`,
            );
          }
        }
      }
    }
  }

  return { failures, measuredFiles };
}

if (import.meta.main) {
  let root = process.cwd();
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--project-root") {
      const value = argv[i + 1];
      if (value === undefined) {
        console.error(
          "usage: bun scripts/check-coverage.ts [--project-root <path>]",
        );
        process.exit(2);
      }
      root = resolve(value);
      i += 1;
    } else {
      console.error(
        "usage: bun scripts/check-coverage.ts [--project-root <path>]",
      );
      process.exit(2);
    }
  }
  const { failures, measuredFiles } = verifyCoverage(root);
  if (failures.length > 0) {
    console.error(
      `coverage gate: FAIL — ${String(failures.length)} problem(s):`,
    );
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }
  if (measuredFiles === 0) {
    console.log(
      "coverage gate: armed — committed thresholds pinned at 100% line/branch; no coverage report yet, per-file enforcement activates with the first product-source coverage run.",
    );
  } else {
    console.log(
      `coverage gate: ok (${String(measuredFiles)} first-party src/** file(s) at 100% line/branch; committed thresholds pinned at 100%).`,
    );
  }
}
