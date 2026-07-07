// Verifies .ai/discipline-adoption.md — the discipline-adoption inventory
// required by SPECIFICATION/non-functional-requirements.md §"Discipline
// adoption inventory". Used in-process by the aggregate check
// (scripts/check.ts) and runnable standalone:
// bun scripts/check-discipline-inventory.ts [--project-root <path>]
//
// Verified shape:
// - the inventory table carries exactly the required columns;
// - every seed-listed baseline discipline has a row;
// - dispositions are one of adopted / locally adapted / deferred / rejected,
//   enforcement classes one of gate-enforced / process-enforced /
//   documented-only / none;
// - gate- and process-enforced rows cite at least one existing artifact in
//   their Local-enforcement-artifact cell — a backticked `bun run <script>`
//   must name a real, non-stub package script, and a backticked path must
//   exist — so a citation cannot silently rot;
// - documented-only rows claim no aggregate coverage ("none") and carry an
//   explicit "not enforced" disclaimer with the reason;
// - deferred/rejected rows use class none with a reason and a revisit
//   condition;
// - class none is only valid for deferred/rejected dispositions;
// - the TDD row is gate-enforced citing the Red -> Green commit-msg hook;
// - the applicable-ecosystem row cites the §"Livespec ecosystem tooling
//   adoption" enumeration rather than a generic undefined row.
//
// Exit codes per §"Exit-code baseline": 0 ok, 1 shape failure, 2 usage
// error, 3 precondition failure (inventory missing).

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const INVENTORY_PATH = ".ai/discipline-adoption.md";

const BASELINE_DISCIPLINES = [
  "TDD",
  "livespec-dev-tooling-inspired shared guidelines",
  "applicable livespec ecosystem tooling",
  "GitHub CI and pull-request discipline",
  "release discipline",
  "top-of-pyramid E2E discipline",
  "linting",
  "fuzzing and property checks",
  "local memory guardrails",
  "standalone dependency boundaries",
  "Bun/Vitest/Playwright/Svelte/SvelteKit/Vercel toolchain discipline",
  "git-jsonl work-item workflow",
] as const;

const REQUIRED_COLUMNS = [
  "discipline",
  "source inspiration",
  "disposition",
  "enforcement class",
  "local enforcement artifact",
  "aggregate-check coverage",
  "notes",
] as const;

const DISPOSITIONS = new Set([
  "adopted",
  "locally adapted",
  "deferred",
  "rejected",
]);

const ENFORCEMENT_CLASSES = new Set([
  "gate-enforced",
  "process-enforced",
  "documented-only",
  "none",
]);

const PATH_TOKEN_PATTERN = /\.(?:ts|js|json|jsonl|md|ya?ml)$/;

export interface InventoryVerification {
  readonly status: "absent" | "fail" | "ok";
  readonly failures: readonly string[];
}

interface PackageJson {
  readonly scripts?: Record<string, string>;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

// Every backticked token in the Local-enforcement-artifact cell that looks
// like a command or path must resolve; at least one must, so the citation
// is real. Plain prose tokens (e.g. flags) are descriptive and ignored.
function verifyCitations(
  root: string,
  pkg: PackageJson,
  discipline: string,
  artifactCell: string,
): string[] {
  const failures: string[] = [];
  let resolved = 0;
  for (const match of artifactCell.matchAll(/`([^`]+)`/g)) {
    const token = match[1] ?? "";
    if (token.startsWith("bun run ")) {
      const script = token.slice("bun run ".length).split(/\s+/)[0] ?? "";
      const command = pkg.scripts?.[script];
      if (command === undefined) {
        failures.push(
          `${discipline}: cites "bun run ${script}" but package.json has no such script`,
        );
      } else if (command.includes("not-yet-provisioned")) {
        failures.push(
          `${discipline}: cites "bun run ${script}", a not-yet-provisioned stub`,
        );
      } else {
        resolved += 1;
      }
    } else if (token.includes("/") || PATH_TOKEN_PATTERN.test(token)) {
      if (existsSync(join(root, token))) {
        resolved += 1;
      } else {
        failures.push(
          `${discipline}: cites ${token}, which does not exist in the repository`,
        );
      }
    }
  }
  if (resolved === 0 && failures.length === 0) {
    failures.push(
      `${discipline}: an enforced row must cite at least one existing ` +
        "runnable command, hook, workflow, or committed record (backticked)",
    );
  }
  return failures;
}

export function verifyDisciplineInventory(root: string): InventoryVerification {
  const inventoryPath = join(root, INVENTORY_PATH);
  if (!existsSync(inventoryPath)) {
    return { status: "absent", failures: [] };
  }
  const packageJsonPath = join(root, "package.json");
  const pkg: PackageJson = existsSync(packageJsonPath)
    ? (JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson)
    : {};
  const failures: string[] = [];
  const lines = readFileSync(inventoryPath, "utf8").split("\n");
  const tableStart = lines.findIndex((line) => line.trim().startsWith("|"));
  if (tableStart === -1) {
    return {
      status: "fail",
      failures: [`${INVENTORY_PATH} contains no inventory table`],
    };
  }
  const tableLines: string[] = [];
  for (let i = tableStart; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (!line.trim().startsWith("|")) {
      break;
    }
    tableLines.push(line);
  }
  const header = splitRow(tableLines[0] ?? "").map((cell) =>
    cell.toLowerCase(),
  );
  if (header.join(" | ") !== REQUIRED_COLUMNS.join(" | ")) {
    failures.push(
      `the inventory table must carry exactly these columns: ${REQUIRED_COLUMNS.join(", ")}`,
    );
  }
  const rows = tableLines
    .slice(1)
    .filter((line) => !/^\s*\|[\s|:-]+\|\s*$/.test(line))
    .map(splitRow);

  const byDiscipline = new Map<string, string[]>();
  for (const cells of rows) {
    if (cells.length !== REQUIRED_COLUMNS.length) {
      failures.push(
        `malformed inventory row (${String(cells.length)} cells): | ${cells.join(" | ")} |`,
      );
      continue;
    }
    byDiscipline.set((cells[0] ?? "").toLowerCase(), cells);
  }

  for (const discipline of BASELINE_DISCIPLINES) {
    if (!byDiscipline.has(discipline.toLowerCase())) {
      failures.push(`missing required baseline row: ${discipline}`);
    }
  }

  for (const cells of byDiscipline.values()) {
    const [discipline, , dispositionCell, classCell, artifact, coverage] =
      cells as [string, string, string, string, string, string, string];
    const notes = cells[6] ?? "";
    const disposition = dispositionCell.toLowerCase();
    const enforcementClass = classCell.toLowerCase();
    if (!DISPOSITIONS.has(disposition)) {
      failures.push(
        `${discipline}: disposition "${dispositionCell}" is not one of adopted, locally adapted, deferred, rejected`,
      );
      continue;
    }
    if (!ENFORCEMENT_CLASSES.has(enforcementClass)) {
      failures.push(
        `${discipline}: enforcement class "${classCell}" is not one of gate-enforced, process-enforced, documented-only, none`,
      );
      continue;
    }
    if (
      (disposition === "deferred" || disposition === "rejected") &&
      enforcementClass !== "none"
    ) {
      failures.push(
        `${discipline}: a ${disposition} row must use enforcement class none`,
      );
    }
    if (
      enforcementClass === "none" &&
      disposition !== "deferred" &&
      disposition !== "rejected"
    ) {
      failures.push(
        `${discipline}: enforcement class none is only valid for deferred or rejected rows`,
      );
    }
    if (disposition === "deferred" || disposition === "rejected") {
      if (!/reason/i.test(notes) || !/revisit/i.test(notes)) {
        failures.push(
          `${discipline}: a ${disposition} row must state its reason and the condition to revisit the decision`,
        );
      }
    }
    if (enforcementClass === "documented-only") {
      if (coverage.toLowerCase() !== "none") {
        failures.push(
          `${discipline}: a documented-only row must not claim aggregate-check coverage (found "${coverage}")`,
        );
      }
      if (!/not enforced/i.test(notes) || !/reason/i.test(notes)) {
        failures.push(
          `${discipline}: a documented-only row must say it is not enforced and record the reason no gate exists`,
        );
      }
    }
    if (
      enforcementClass === "gate-enforced" ||
      enforcementClass === "process-enforced"
    ) {
      failures.push(...verifyCitations(root, pkg, discipline, artifact));
    }
    if (discipline.toLowerCase() === "tdd") {
      if (
        enforcementClass !== "gate-enforced" ||
        !/commit-msg|tdd-commit-msg-hook/.test(artifact)
      ) {
        failures.push(
          "TDD: the row must be gate-enforced, citing the Red -> Green commit-msg hook (.githooks/commit-msg)",
        );
      }
    }
    if (discipline.toLowerCase() === "applicable livespec ecosystem tooling") {
      if (!/livespec ecosystem tooling adoption/i.test(cells.join(" "))) {
        failures.push(
          'applicable livespec ecosystem tooling: the row must cite the §"Livespec ecosystem tooling adoption" enumeration',
        );
      }
    }
  }

  return failures.length > 0
    ? { status: "fail", failures }
    : { status: "ok", failures: [] };
}

if (import.meta.main) {
  let root = process.cwd();
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--project-root") {
      const value = argv[i + 1];
      if (value === undefined) {
        console.error(
          "usage: bun scripts/check-discipline-inventory.ts [--project-root <path>]",
        );
        process.exit(2);
      }
      root = resolve(value);
      i += 1;
    } else {
      console.error(
        "usage: bun scripts/check-discipline-inventory.ts [--project-root <path>]",
      );
      process.exit(2);
    }
  }
  const result = verifyDisciplineInventory(root);
  if (result.status === "absent") {
    console.error(
      `precondition failure: ${INVENTORY_PATH} is missing — required before the first non-trivial implementation merge`,
    );
    process.exit(3);
  }
  if (result.status === "fail") {
    console.error(
      `discipline-adoption inventory: FAIL — ${String(result.failures.length)} problem(s):`,
    );
    for (const failure of result.failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }
  console.log(
    "discipline-adoption inventory: ok (baseline rows, dispositions, enforcement classes, citations).",
  );
}
