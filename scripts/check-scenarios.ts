// The scenario coverage gate — `bun run check:scenarios` — per
// SPECIFICATION/non-functional-requirements.md §"Top-of-pyramid discipline".
// Standalone Bun/TypeScript (no external enforcement suite per
// constraints.md §"Standalone boundary").
//
// Every load-bearing `## Scenario:` heading in SPECIFICATION/scenarios.md
// MUST be classified either browser-observable or non-browser-exercisable
// and carry a top-level test mapping of that class:
//
// - browser-observable — user-visible behavior in the running app — maps to
//   at least one Playwright end-to-end test identifier.
// - non-browser-exercisable — a data, build/prerender, or tooling invariant
//   with no faithful browser rendering — maps to at least one test of a
//   named non-Playwright category (a Vitest unit/integration test, a
//   fast-check property/fuzz test, or a build/prerender check) plus a
//   one-line rationale for why a Playwright mapping would mislead.
//
// The committed mapping lives in scenario-coverage.json (the source of truth
// for each scenario's test identifiers). The AUTHORITATIVE class of every
// load-bearing scenario is pinned HERE, in EXPECTED_CLASS, kept separate
// from the mapping data so a browser-observable scenario cannot be
// re-declared non-browser-exercisable in the JSON to dodge Playwright (or
// vice versa). The gate verifies:
//
// - the load-bearing scenario set in scenarios.md exactly matches the pinned
//   set here (so adding/revising a scenario forces a same-change
//   classification), and later-phase scenarios are excluded;
// - every load-bearing scenario carries exactly one mapping of its pinned
//   class, no later-phase or stale scenario is mapped;
// - browser-observable entries carry >=1 well-formed Playwright identifier
//   and no non-browser fields; non-browser entries carry a valid category,
//   >=1 well-formed non-Playwright identifier, and a rationale;
// - each mapped identifier resolves to an existing, EXECUTABLE test — the
//   file is parsed with the TypeScript compiler and must declare a real
//   test(...) / it(...) with a matching title that is not skipped/pending
//   (a comment, commented-out call, or string literal does not count) —
//   ARMED until first-party src/** product source lands, then enforced,
//   mirroring the other additive gates.
//
// Exit codes per §"Exit-code baseline": 0 ok/armed, 1 violations, 2 usage.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";

export const SCENARIOS_PATH = "SPECIFICATION/scenarios.md";
export const COVERAGE_PATH = "scenario-coverage.json";

// The named non-Playwright categories a non-browser-exercisable scenario may
// map to (§"Top-of-pyramid discipline": a Vitest unit or integration test, a
// fast-check property/fuzz test, or a build/prerender check).
const ALLOWED_CATEGORIES = [
  "vitest-unit",
  "vitest-integration",
  "fast-check-property",
  "build-prerender-check",
] as const;

type ScenarioClass = "browser-observable" | "non-browser-exercisable";

// The authoritative class of every load-bearing scenario in
// SPECIFICATION/scenarios.md. This is the anti-dodge floor: the JSON mapping
// must declare the same class. When a scenario is added to or revised in
// scenarios.md, its class MUST be pinned here in the same change (the gate
// fails on any scenarios.md scenario missing from this map, and vice versa).
const EXPECTED_CLASS: Readonly<Record<string, ScenarioClass>> = {
  "Governed data preserves the predecessor data shape":
    "non-browser-exercisable",
  "Import transcribes the predecessor production content":
    "non-browser-exercisable",
  "Malformed governed data is rejected at load": "non-browser-exercisable",
  "Import derives stable item anchors deterministically":
    "non-browser-exercisable",
  "Committed governed source round-trips the pinned production inventory":
    "non-browser-exercisable",
  "Phase-1 data load tolerates deferred optional collections":
    "non-browser-exercisable",
  "Search projection is generated without a browser DOM":
    "non-browser-exercisable",
  "Sections derive stable slugs used by Contents and offset anchors":
    "non-browser-exercisable",
  "Visitor opens the interactive resume": "browser-observable",
  "Interactive mode renders prerendered content without a blank page":
    "browser-observable",
  "Interactive mode preserves section names and order": "browser-observable",
  "Navigation shell collapses responsively": "browser-observable",
  "Visitor uses the About and Instructions controls": "browser-observable",
  "Visitor navigates to a stable resume item": "browser-observable",
  "Hash navigation to a missing anchor is a no-op": "browser-observable",
  "Revealed section clears the sticky navigation bar": "browser-observable",
  "Visitor follows a legacy section anchor": "browser-observable",
  "Visitor searches the interactive resume": "browser-observable",
  "Search matches markdown-stripped description text": "browser-observable",
  "Search matches the governed dataset's worked example": "browser-observable",
  "No-match search preserves section structure": "browser-observable",
  "Search composes with skill filter and section sort": "browser-observable",
  "Visitor filters by skill level": "browser-observable",
  "Invalid skill level is rejected at load": "non-browser-exercisable",
  "Visitor sorts a section": "browser-observable",
  "Missing start date sorts as earliest": "browser-observable",
  "Missing end date sorts as current": "browser-observable",
  "Equal dates break ties by item name": "browser-observable",
  "Invalid sort input falls back to default order": "non-browser-exercisable",
  "Visitor collapses and expands a section": "browser-observable",
  "Visitor resets interactive state": "browser-observable",
  "Item dates render in predecessor format": "browser-observable",
  "Markdown renders consistently across modes": "non-browser-exercisable",
  "Governed data failure never ships a broken resume":
    "non-browser-exercisable",
  "Visitor renders the static resume": "browser-observable",
  "Surfaces expose predecessor browser metadata": "browser-observable",
};

export interface ScenarioVerification {
  readonly failures: readonly string[];
  readonly armed: boolean;
  readonly counts: { browserObservable: number; nonBrowser: number };
}

interface ParsedSpec {
  readonly loadBearing: readonly string[];
  readonly laterPhase: readonly string[];
}

// Splits SPECIFICATION/scenarios.md into load-bearing and later-phase
// scenario titles. Load-bearing scenarios precede the `## Later-phase`
// marker heading; everything after it is excluded until activated.
export function parseScenarioSpec(text: string): ParsedSpec {
  const loadBearing: string[] = [];
  const laterPhase: string[] = [];
  let inLaterPhase = false;
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (/^##\s+Later-phase\b/.test(line)) {
      inLaterPhase = true;
      continue;
    }
    const match = /^##\s+Scenario:\s+(.+)$/.exec(line);
    if (match) {
      const title = (match[1] ?? "").trim();
      if (inLaterPhase) {
        laterPhase.push(title);
      } else {
        loadBearing.push(title);
      }
    }
  }
  return { loadBearing, laterPhase };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmptyStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.length > 0)
  );
}

interface Identifier {
  readonly path: string;
  readonly title: string;
}

// Identifier grammar: "<repo-relative test file>.ts > <test title>".
function parseIdentifier(id: string): Identifier | null {
  const sep = id.indexOf(" > ");
  if (sep === -1) {
    return null;
  }
  const path = id.slice(0, sep).trim();
  const title = id.slice(sep + 3).trim();
  if (path.length === 0 || title.length === 0) {
    return null;
  }
  return { path, title };
}

function isSafeRelativePath(path: string): boolean {
  return (
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.split("/").includes("..") &&
    path.endsWith(".ts")
  );
}

function isPlaywrightPath(path: string): boolean {
  return path.startsWith("e2e/") || path.endsWith(".e2e.ts");
}

function isNonBrowserTestPath(path: string): boolean {
  return (
    (path.endsWith(".test.ts") || path.endsWith(".spec.ts")) &&
    !isPlaywrightPath(path)
  );
}

function productSourcePresent(root: string): boolean {
  const srcDir = join(root, "src");
  return existsSync(srcDir) && readdirSync(srcDir).length > 0;
}

// A mapped identifier must resolve to a REAL, executable test declaration —
// not a comment, a prose mention, a string that merely quotes a call, or a
// disabled/pending test. A raw text scan would let a `// <title>` comment, a
// commented-out `// test("<title>", ...)` call, or a `test.skip("<title>")`
// placeholder satisfy the gate once src/** product source lands. So the
// resolver PARSES the file with the TypeScript compiler and inspects real
// `test(...)` / `it(...)` call expressions (Playwright, Vitest, and Bun share
// this grammar): the AST carries no comments and treats string literals as
// data, so neither comment nor string spoofs are seen as calls.
interface TestDecl {
  readonly title: string;
  readonly skipped: boolean;
}

// A leaf test is `test(...)` / `it(...)` with an empty modifier chain or only
// executable modifiers. skip/todo/fixme/failing are non-executing (pending or
// expected-to-fail); every other modifier (describe, step, before*/after*
// hooks, use, ...) is a suite/hook, not a leaf test, and is ignored.
const REJECT_MODS = new Set(["skip", "todo", "fixme", "failing"]);
const EXECUTABLE_MODS = new Set([
  "only",
  "concurrent",
  "sequential",
  "serial",
  "each",
]);

// If `expression` is a `test`/`it` callee (optionally with a `.skip`/`.only`/…
// modifier chain), returns the lowercased modifier names; otherwise null.
function testCalleeMods(expression: ts.Expression): string[] | null {
  if (ts.isIdentifier(expression)) {
    return expression.text === "test" || expression.text === "it" ? [] : null;
  }
  if (ts.isPropertyAccessExpression(expression)) {
    const inner = testCalleeMods(expression.expression);
    return inner === null
      ? null
      : [...inner, expression.name.text.toLowerCase()];
  }
  return null;
}

function stringLiteralValue(node: ts.Node): string | null {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
    ? node.text
    : null;
}

export function collectTestDecls(
  content: string,
  fileName: string,
): TestDecl[] {
  const source = ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ false,
    ts.ScriptKind.TS,
  );
  const decls: TestDecl[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const mods = testCalleeMods(node.expression);
      const first = node.arguments[0];
      const title = first === undefined ? null : stringLiteralValue(first);
      if (mods !== null && title !== null) {
        const rejected = mods.some((mod) => REJECT_MODS.has(mod));
        const executableOnly = mods.every((mod) => EXECUTABLE_MODS.has(mod));
        // Ignore suites/hooks/steps: a modifier that is neither a
        // reject-marker nor a known executable variant is not a leaf test.
        if (rejected || executableOnly) {
          decls.push({ title: title.trim(), skipped: rejected });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(source, visit);
  return decls;
}

// Resolves an identifier's file: the file must exist and declare an
// executable test whose title equals the mapped title. Returns a failure
// message, or null when it resolves.
function resolveIdentifier(
  root: string,
  scenario: string,
  { path, title }: Identifier,
): string | null {
  const abs = join(root, path);
  if (!existsSync(abs)) {
    return `scenario "${scenario}" maps to ${path}, which does not exist (stale or missing test)`;
  }
  const matches = collectTestDecls(readFileSync(abs, "utf8"), path).filter(
    (decl) => decl.title === title.trim(),
  );
  if (matches.length === 0) {
    return `scenario "${scenario}" maps to a test titled "${title}" in ${path}, but no executable test(...) / it(...) with that title exists there — a comment or prose mention does not count (stale or placeholder mapping)`;
  }
  if (matches.every((decl) => decl.skipped)) {
    return `scenario "${scenario}" maps to "${title}" in ${path}, but that test is skipped/pending (test.skip/todo/fixme/failing) — a mapped scenario needs an executable test`;
  }
  return null;
}

function verifyBrowserEntry(
  entry: Record<string, unknown>,
  scenario: string,
): string[] {
  const failures: string[] = [];
  for (const forbidden of ["category", "tests", "rationale"]) {
    if (forbidden in entry) {
      failures.push(
        `browser-observable scenario "${scenario}" must not carry a "${forbidden}" field — it maps to Playwright identifiers only`,
      );
    }
  }
  const playwright = entry["playwright"];
  if (!nonEmptyStrings(playwright)) {
    failures.push(
      `browser-observable scenario "${scenario}" must list at least one Playwright test identifier in "playwright"`,
    );
    return failures;
  }
  for (const id of playwright) {
    const parsed = parseIdentifier(id);
    if (parsed === null || !isSafeRelativePath(parsed.path)) {
      failures.push(
        `scenario "${scenario}" has a malformed Playwright identifier "${id}" — expected "<e2e file>.ts > <test title>"`,
      );
      continue;
    }
    if (!isPlaywrightPath(parsed.path)) {
      failures.push(
        `scenario "${scenario}" maps to "${parsed.path}", which is not a Playwright e2e spec (must be under e2e/ or end in .e2e.ts) — a browser-observable scenario needs a real Playwright test`,
      );
    }
  }
  return failures;
}

function verifyNonBrowserEntry(
  entry: Record<string, unknown>,
  scenario: string,
): string[] {
  const failures: string[] = [];
  if ("playwright" in entry) {
    failures.push(
      `non-browser-exercisable scenario "${scenario}" must not carry a "playwright" field — it maps to a named non-Playwright category`,
    );
  }
  const category = entry["category"];
  if (
    typeof category !== "string" ||
    !(ALLOWED_CATEGORIES as readonly string[]).includes(category)
  ) {
    failures.push(
      `non-browser-exercisable scenario "${scenario}" must name a "category" from: ${ALLOWED_CATEGORIES.join(", ")}`,
    );
  }
  const rationale = entry["rationale"];
  if (typeof rationale !== "string" || rationale.trim().length === 0) {
    failures.push(
      `non-browser-exercisable scenario "${scenario}" must record a "rationale" for why a Playwright mapping would mislead`,
    );
  }
  const tests = entry["tests"];
  if (!nonEmptyStrings(tests)) {
    failures.push(
      `non-browser-exercisable scenario "${scenario}" must list at least one test identifier in "tests"`,
    );
    return failures;
  }
  for (const id of tests) {
    const parsed = parseIdentifier(id);
    if (parsed === null || !isSafeRelativePath(parsed.path)) {
      failures.push(
        `scenario "${scenario}" has a malformed test identifier "${id}" — expected "<test file>.ts > <test title>"`,
      );
      continue;
    }
    if (!isNonBrowserTestPath(parsed.path)) {
      failures.push(
        `scenario "${scenario}" maps to "${parsed.path}", which is not a non-Playwright test file (must end in .test.ts/.spec.ts and not be a Playwright e2e spec)`,
      );
    }
  }
  return failures;
}

function identifiersOf(entry: Record<string, unknown>): string[] {
  const ids: string[] = [];
  for (const key of ["playwright", "tests"]) {
    const value = entry[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          ids.push(item);
        }
      }
    }
  }
  return ids;
}

export function verifyScenarios(root: string): ScenarioVerification {
  const empty = { browserObservable: 0, nonBrowser: 0 };
  const specPath = resolve(root, SCENARIOS_PATH);
  if (!existsSync(specPath)) {
    return {
      failures: [
        `${SCENARIOS_PATH} is missing — the scenario spec is required`,
      ],
      armed: false,
      counts: empty,
    };
  }
  const coveragePath = resolve(root, COVERAGE_PATH);
  if (!existsSync(coveragePath)) {
    return {
      failures: [
        `${COVERAGE_PATH} is missing — the committed scenario-to-test coverage mapping is required`,
      ],
      armed: false,
      counts: empty,
    };
  }

  const { loadBearing, laterPhase } = parseScenarioSpec(
    readFileSync(specPath, "utf8"),
  );

  const failures: string[] = [];

  // The load-bearing set in scenarios.md must exactly equal the pinned set,
  // so a scenario cannot be added/revised without a same-change class pin.
  const loadBearingSet = new Set(loadBearing);
  const pinned = new Set(Object.keys(EXPECTED_CLASS));
  for (const title of loadBearing) {
    if (!pinned.has(title)) {
      failures.push(
        `${SCENARIOS_PATH} has load-bearing scenario "${title}" with no pinned class in scripts/check-scenarios.ts — classify it (browser-observable or non-browser-exercisable) in the same change that adds or revises the scenario`,
      );
    }
  }
  for (const title of pinned) {
    if (!loadBearingSet.has(title)) {
      const moved = laterPhase.includes(title)
        ? " (it is now later-phase)"
        : "";
      failures.push(
        `scripts/check-scenarios.ts pins a class for "${title}"${moved}, but it is no longer a load-bearing scenario in ${SCENARIOS_PATH} — remove or re-classify the pin`,
      );
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(coveragePath, "utf8"));
  } catch {
    return {
      failures: [...failures, `${COVERAGE_PATH} is not valid JSON`],
      armed: false,
      counts: empty,
    };
  }
  const coverage = asRecord(parsed);
  const rawMappings = coverage?.["mappings"];
  if (coverage === null || !Array.isArray(rawMappings)) {
    return {
      failures: [
        ...failures,
        `${COVERAGE_PATH} must be a JSON object with a "mappings" array`,
      ],
      armed: false,
      counts: empty,
    };
  }

  // The JSON's declared category list, when present, must match the gate's
  // authoritative set so the documented categories cannot drift.
  const declaredCategories = coverage["nonBrowserCategories"];
  if (declaredCategories !== undefined) {
    const declared: string[] | null = Array.isArray(declaredCategories)
      ? declaredCategories.map((value: unknown) => String(value)).sort()
      : null;
    const expected = [...ALLOWED_CATEGORIES].sort();
    if (declared === null || declared.join(",") !== expected.join(",")) {
      failures.push(
        `${COVERAGE_PATH} "nonBrowserCategories" must list exactly: ${expected.join(", ")}`,
      );
    }
  }

  const entries = new Map<string, Record<string, unknown>>();
  for (const raw of rawMappings) {
    const entry = asRecord(raw);
    const scenario = entry?.["scenario"];
    if (
      entry === null ||
      typeof scenario !== "string" ||
      scenario.length === 0
    ) {
      failures.push(
        `${COVERAGE_PATH} has a mapping with no string "scenario" field`,
      );
      continue;
    }
    if (entries.has(scenario)) {
      failures.push(
        `${COVERAGE_PATH} has a duplicate mapping for "${scenario}"`,
      );
      continue;
    }
    entries.set(scenario, entry);
  }

  // Every load-bearing scenario must be mapped; no later-phase or stale
  // scenario may be.
  for (const title of loadBearing) {
    if (!entries.has(title)) {
      failures.push(
        `load-bearing scenario "${title}" has no mapping in ${COVERAGE_PATH}`,
      );
    }
  }
  const laterPhaseSet = new Set(laterPhase);
  for (const scenario of entries.keys()) {
    if (loadBearingSet.has(scenario)) {
      continue;
    }
    if (laterPhaseSet.has(scenario)) {
      failures.push(
        `${COVERAGE_PATH} maps later-phase scenario "${scenario}", which must be excluded until a future proposed change activates it`,
      );
    } else {
      failures.push(
        `${COVERAGE_PATH} maps "${scenario}", which is not a load-bearing scenario in ${SCENARIOS_PATH} (stale mapping)`,
      );
    }
  }

  const armed = !productSourcePresent(root);
  let browserObservable = 0;
  let nonBrowser = 0;

  for (const [scenario, entry] of entries) {
    const declaredClass = entry["class"];
    if (
      declaredClass !== "browser-observable" &&
      declaredClass !== "non-browser-exercisable"
    ) {
      failures.push(
        `scenario "${scenario}" has an invalid class "${String(declaredClass)}" — must be browser-observable or non-browser-exercisable`,
      );
      continue;
    }
    const expected = EXPECTED_CLASS[scenario];
    if (expected !== undefined && declaredClass !== expected) {
      failures.push(
        `scenario "${scenario}" is declared ${declaredClass} but its pinned class is ${expected} — a browser-observable scenario must not be declared non-browser-exercisable to dodge Playwright (or vice versa)`,
      );
      continue;
    }
    if (declaredClass === "browser-observable") {
      browserObservable += 1;
      failures.push(...verifyBrowserEntry(entry, scenario));
    } else {
      nonBrowser += 1;
      failures.push(...verifyNonBrowserEntry(entry, scenario));
    }
    if (!armed) {
      for (const id of identifiersOf(entry)) {
        const parsedId = parseIdentifier(id);
        if (parsedId !== null && isSafeRelativePath(parsedId.path)) {
          const failure = resolveIdentifier(root, scenario, parsedId);
          if (failure !== null) {
            failures.push(failure);
          }
        }
      }
    }
  }

  return {
    failures,
    armed,
    counts: { browserObservable, nonBrowser },
  };
}

if (import.meta.main) {
  let root = process.cwd();
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--project-root") {
      const value = argv[i + 1];
      if (value === undefined) {
        console.error(
          "usage: bun scripts/check-scenarios.ts [--project-root <path>]",
        );
        process.exit(2);
      }
      root = resolve(value);
      i += 1;
    } else {
      console.error(
        "usage: bun scripts/check-scenarios.ts [--project-root <path>]",
      );
      process.exit(2);
    }
  }
  const { failures, armed, counts } = verifyScenarios(root);
  if (failures.length > 0) {
    console.error(
      `scenario coverage gate: FAIL — ${String(failures.length)} problem(s):`,
    );
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }
  const summary = `${String(counts.browserObservable)} browser-observable (Playwright), ${String(counts.nonBrowser)} non-browser-exercisable`;
  if (armed) {
    console.log(
      `scenario coverage gate: armed — ${summary}; every load-bearing scenario classified and mapped. Test-identifier resolution activates when the first src/** product source lands.`,
    );
  } else {
    console.log(
      `scenario coverage gate: ok — ${summary}; every load-bearing scenario mapped and every identifier resolves to an existing test.`,
    );
  }
}
