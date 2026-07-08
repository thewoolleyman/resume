// The property/fuzz reproducibility gate — `bun run test:property` — per
// SPECIFICATION/non-functional-requirements.md §"Fuzzing and property
// checks". Standalone Bun/TypeScript (no external enforcement suite per
// constraints.md §"Standalone boundary").
//
// The spec requires that property and fuzz tests be REPRODUCIBLE, and that
// the aggregate check fail when the required reproducibility metadata is
// absent. That metadata lives in property.config.json (the committed source
// of truth, kept SEPARATE from this gate so removing a field is caught by
// an unchanged gate). This gate verifies the metadata is present and
// well-formed:
//
// - runner: `fast-check` (or a documented stricter equivalent — any other
//   runner MUST carry a `runnerRationale` recording the coverage it
//   provides).
// - seed: a fixed integer or the string "logged" — every property target
//   runs with a fixed or logged seed.
// - runCounts: a fast local mode and a deeper CI mode, both positive
//   integers with ci >= fast (declared minimum run counts).
// - replayCommand: the local command that re-runs a failed seed
//   deterministically.
// - captureShrunkCounterexamples: true — shrunk counterexamples are
//   captured in failure logs.
// - generatorClasses: the valid/malformed/adversarial/boundary/legacy
//   classes, so the malformed and adversarial portion cannot silently
//   collapse into happy-path generation.
//
// With no first-party src/** property targets yet the gate is ARMED: it
// enforces the committed reproducibility policy now, and per-target
// verification (each phase-1 target under src/** carries a property or
// fuzz test wired to this policy) activates when product source lands.
//
// Exit codes per §"Exit-code baseline": 0 ok/armed, 1 violations, 2 usage.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const PROPERTY_CONFIG_PATH = "property.config.json";

// The five generator classes the spec names so malformed/adversarial input
// cannot silently collapse into happy-path generation.
const REQUIRED_GENERATOR_CLASSES = [
  "valid-domain",
  "malformed",
  "adversarial",
  "boundary",
  "legacy-compatibility",
] as const;

export interface PropertyVerification {
  readonly failures: readonly string[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function verifyRunner(
  config: Record<string, unknown>,
  failures: string[],
): void {
  const runner = config["runner"];
  if (typeof runner !== "string" || runner.length === 0) {
    failures.push(
      `${PROPERTY_CONFIG_PATH} must name a "runner" (fast-check or a documented stricter equivalent)`,
    );
    return;
  }
  if (
    runner !== "fast-check" &&
    typeof config["runnerRationale"] !== "string"
  ) {
    failures.push(
      `${PROPERTY_CONFIG_PATH} runner "${runner}" is not fast-check — a stricter equivalent must carry a "runnerRationale" recording the coverage it provides`,
    );
  }
}

function verifySeed(config: Record<string, unknown>, failures: string[]): void {
  const seed = config["seed"];
  const fixed = typeof seed === "number" && Number.isInteger(seed);
  if (!fixed && seed !== "logged") {
    failures.push(
      `${PROPERTY_CONFIG_PATH} must set "seed" to a fixed integer or "logged" so each property target runs with a fixed or logged seed`,
    );
  }
}

function verifyRunCounts(
  config: Record<string, unknown>,
  failures: string[],
): void {
  const runCounts = asRecord(config["runCounts"]);
  if (runCounts === null) {
    failures.push(
      `${PROPERTY_CONFIG_PATH} must declare "runCounts" with a fast local mode and a deeper CI mode`,
    );
    return;
  }
  const fast = runCounts["fast"];
  const ci = runCounts["ci"];
  if (!isPositiveInteger(fast)) {
    failures.push(
      `${PROPERTY_CONFIG_PATH} runCounts.fast must be a positive integer (the fast local minimum run count)`,
    );
  }
  if (!isPositiveInteger(ci)) {
    failures.push(
      `${PROPERTY_CONFIG_PATH} runCounts.ci must be a positive integer (the deeper CI minimum run count)`,
    );
  }
  if (isPositiveInteger(fast) && isPositiveInteger(ci) && ci < fast) {
    failures.push(
      `${PROPERTY_CONFIG_PATH} runCounts.ci (${String(ci)}) must be >= runCounts.fast (${String(fast)}) — CI runs at least as deep as the fast local mode`,
    );
  }
}

function verifyGeneratorClasses(
  config: Record<string, unknown>,
  failures: string[],
): void {
  const classes = config["generatorClasses"];
  if (!Array.isArray(classes)) {
    failures.push(`${PROPERTY_CONFIG_PATH} must list "generatorClasses"`);
    return;
  }
  const present = new Set(
    classes.filter((c): c is string => typeof c === "string"),
  );
  const missing = REQUIRED_GENERATOR_CLASSES.filter(
    (required) => !present.has(required),
  );
  if (missing.length > 0) {
    failures.push(
      `${PROPERTY_CONFIG_PATH} generatorClasses is missing required class(es): ${missing.join(", ")} — the malformed/adversarial portion must not collapse into happy-path generation`,
    );
  }
}

export function verifyProperty(root: string): PropertyVerification {
  const configPath = resolve(root, PROPERTY_CONFIG_PATH);
  if (!existsSync(configPath)) {
    return {
      failures: [
        `${PROPERTY_CONFIG_PATH} is missing — the committed property/fuzz reproducibility metadata (runner, seed, run counts, replay command, shrink capture, generator classes) is required`,
      ],
    };
  }

  let config: Record<string, unknown> | null;
  try {
    config = asRecord(JSON.parse(readFileSync(configPath, "utf8")));
  } catch {
    return { failures: [`${PROPERTY_CONFIG_PATH} is not valid JSON`] };
  }
  if (config === null) {
    return {
      failures: [
        `${PROPERTY_CONFIG_PATH} must be a JSON object of reproducibility metadata`,
      ],
    };
  }

  const failures: string[] = [];
  verifyRunner(config, failures);
  verifySeed(config, failures);
  verifyRunCounts(config, failures);
  if (
    typeof config["replayCommand"] !== "string" ||
    config["replayCommand"] === ""
  ) {
    failures.push(
      `${PROPERTY_CONFIG_PATH} must set a non-empty "replayCommand" that re-runs a failed seed deterministically`,
    );
  }
  if (config["captureShrunkCounterexamples"] !== true) {
    failures.push(
      `${PROPERTY_CONFIG_PATH} must set "captureShrunkCounterexamples" to true so shrunk counterexamples are captured in failure logs`,
    );
  }
  verifyGeneratorClasses(config, failures);
  return { failures };
}

if (import.meta.main) {
  let root = process.cwd();
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--project-root") {
      const value = argv[i + 1];
      if (value === undefined) {
        console.error(
          "usage: bun scripts/check-property.ts [--project-root <path>]",
        );
        process.exit(2);
      }
      root = resolve(value);
      i += 1;
    } else {
      console.error(
        "usage: bun scripts/check-property.ts [--project-root <path>]",
      );
      process.exit(2);
    }
  }
  const { failures } = verifyProperty(root);
  if (failures.length > 0) {
    console.error(
      `property/fuzz reproducibility gate: FAIL — ${String(failures.length)} problem(s):`,
    );
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }
  console.log(
    "property/fuzz reproducibility gate: armed — reproducibility metadata (runner, seed, run counts, replay command, shrink capture, generator classes) verified; per-target checks activate with the first src/** property target.",
  );
}
