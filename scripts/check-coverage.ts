// The coverage gate — `bun run test:coverage` — per
// SPECIFICATION/non-functional-requirements.md §"Test coverage
// expectations". Standalone Bun/TypeScript (no external enforcement suite
// per constraints.md §"Standalone boundary"). Three enforced things:
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
// 3. When first-party src/** product source exists on disk, its coverage
//    must actually be PROVEN: a coverage report must be present and every
//    first-party src/** source file must appear in it (so its 100% floor
//    is measured). Present source with no report — or a report that omits
//    a source file — fails. Without this, `test:coverage` could pass while
//    measuring nothing once the product-source boundary is relaxed.
//
// With NO first-party src/** source and no report the gate is ARMED: the
// committed threshold floor is still enforced, and the per-file / coverage
// proof checks activate the moment product source (and its report) exist
// (additive provisioning, no bootstrap window). Coverage/ is gitignored, so
// on a clean checkout the report is produced by the coverage run itself.
//
// When the Vitest toolchain lands, `test:coverage` becomes
// `vitest run --coverage && bun scripts/check-coverage.ts`: Vitest produces
// the report and enforces the global thresholds from coverage.config.json,
// and this gate enforces the per-file 100% floor, the committed threshold
// floor, and that every src/** file is actually measured. See
// scripts/README.md §"Coverage gate".
//
// Exit codes per §"Exit-code baseline": 0 ok/armed, 1 violations, 2 usage.

import { existsSync, readdirSync, readFileSync } from "node:fs";
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

// First-party product-source file extensions under src/**. Test artifacts,
// declaration files, snapshots, and fixtures are excluded — they are not
// product source and are not counted (§"Test coverage expectations").
const SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".svelte",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
] as const;

export interface CoverageVerification {
  readonly failures: readonly string[];
  readonly enforcedFiles: number;
  readonly armed: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function isFirstPartySourceFile(name: string): boolean {
  if (
    name.endsWith(".test.ts") ||
    name.endsWith(".spec.ts") ||
    name.endsWith(".d.ts")
  ) {
    return false;
  }
  return SOURCE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

// Enumerates first-party product-source files under src/** (relative POSIX
// paths). Symlinks, test artifacts, generated declaration files, snapshot
// and fixture directories are excluded.
function collectFirstPartySources(root: string, dir = "src"): string[] {
  const absolute = resolve(root, dir);
  if (!existsSync(absolute)) {
    return [];
  }
  const files: string[] = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (
      entry.isSymbolicLink() ||
      entry.name === "__snapshots__" ||
      entry.name === "__fixtures__"
    ) {
      continue;
    }
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...collectFirstPartySources(root, rel));
    } else if (isFirstPartySourceFile(entry.name)) {
      files.push(rel);
    }
  }
  return files;
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
    return { failures, enforcedFiles: 0, armed: false };
  }

  let config: Record<string, unknown> | null;
  try {
    config = asRecord(readJson(configPath));
  } catch {
    return {
      failures: [`${COVERAGE_CONFIG_PATH} is not valid JSON`],
      enforcedFiles: 0,
      armed: false,
    };
  }
  if (config === null) {
    return {
      failures: [`${COVERAGE_CONFIG_PATH} must be a JSON object of thresholds`],
      enforcedFiles: 0,
      armed: false,
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

  // First-party product-source files on disk whose 100% coverage must be
  // proven, and the set of src/** files the report actually measures.
  const sourceFiles = collectFirstPartySources(root);
  const measured = new Set<string>();
  const summaryPath = resolve(root, COVERAGE_SUMMARY_PATH);
  const reportExists = existsSync(summaryPath);

  if (reportExists) {
    let summary: Record<string, unknown> | null;
    try {
      summary = asRecord(readJson(summaryPath));
    } catch {
      return {
        failures: [...failures, `${COVERAGE_SUMMARY_PATH} is not valid JSON`],
        enforcedFiles: 0,
        armed: false,
      };
    }
    if (summary === null) {
      failures.push(`${COVERAGE_SUMMARY_PATH} must be a JSON object`);
    } else {
      for (const [key, entry] of Object.entries(summary)) {
        if (key === "total" || !isFirstPartySource(root, key)) {
          continue;
        }
        const relKey = relative(root, resolve(root, key));
        measured.add(relKey);
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

  // Coverage-proof guard: present first-party src/** source must be
  // measured. Without this, "armed" would pass while measuring nothing.
  if (sourceFiles.length > 0) {
    if (!reportExists) {
      failures.push(
        `first-party src/** product source is present (${String(sourceFiles.length)} file(s)) but no coverage report (${COVERAGE_SUMMARY_PATH}) proves its 100% line/branch coverage — run test:coverage with the coverage reporter`,
      );
    } else {
      for (const sourceFile of sourceFiles) {
        if (!measured.has(sourceFile)) {
          failures.push(
            `${sourceFile}: first-party src/** source is not present in the coverage report — every src/** file must be measured at 100% line/branch (no un-measured product source)`,
          );
        }
      }
    }
  }

  const armed = sourceFiles.length === 0 && measured.size === 0;
  const enforcedFiles =
    sourceFiles.length > 0 ? sourceFiles.length : measured.size;
  return { failures, enforcedFiles, armed };
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
  const { failures, enforcedFiles, armed } = verifyCoverage(root);
  if (failures.length > 0) {
    console.error(
      `coverage gate: FAIL — ${String(failures.length)} problem(s):`,
    );
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }
  if (armed) {
    console.log(
      "coverage gate: armed — committed thresholds pinned at 100% line/branch; no first-party src/** source or report yet, per-file enforcement activates with the first product-source coverage run.",
    );
  } else {
    console.log(
      `coverage gate: ok (${String(enforcedFiles)} first-party src/** file(s) at 100% line/branch; committed thresholds pinned at 100%).`,
    );
  }
}
