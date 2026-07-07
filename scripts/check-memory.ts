// The local memory guardrail per
// SPECIFICATION/non-functional-requirements.md §"Local memory guardrails":
// repository automation and agent workflows must not persist private local
// memories in hidden tool state; agent-facing notes live under .ai/*.md and
// are indexed from AGENTS.md. Run as `bun run check:memory` (aggregate mode)
// and by the committed .githooks/pre-commit hook (--staged), so a bypassed
// or uninstalled hook is still caught by `bun run check`.
//
// Rejected:
// - Prohibited private-memory / hidden tool-state paths: .claude/**,
//   .codex/**, .cursor/**, .continue/**, and .aider* files. As the
//   documented mechanical realization of the rest of the prohibited set
//   (hidden memory databases, chat transcripts, prompt transcripts, tool
//   cache directories), every OTHER hidden (dot-prefixed) path is
//   default-denied unless the repository policy in AGENTS.md §"Local memory
//   guardrail policy" documents it as ordinary tool configuration — the
//   allowlist below mirrors that policy.
// - .ai/ entries that are not flat .ai/*.md notes.
// - .ai/*.md notes not indexed from AGENTS.md.
// - AGENTS.md references to missing .ai notes.
//
// Modes: the default checks the tracked tree (the git index when the
// project root is a git repository, a filesystem walk otherwise — e.g. the
// commit-msg hook's staged-tree checkout, which has no .git). --staged
// checks the staged tree: index paths plus the STAGED AGENTS.md content.
//
// Self-contained by design: the pre-commit hook and fixture tests run this
// file standalone, so it imports nothing from sibling harness modules.
//
// Exit codes per §"Exit-code baseline" (documented in scripts/README.md):
// 0 clean, 1 violations found, 2 usage error, 3 precondition failure
// (--staged outside a git repository, or git itself failing).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// The spec-named prohibited tool-state sets. Exceptions are exact paths in
// ORDINARY_EXACT_PATHS only — a prefix can never be allowlisted wholesale.
const PROHIBITED_TOOL_STATE_PREFIXES = [
  ".claude/",
  ".codex/",
  ".cursor/",
  ".continue/",
] as const;

// Ordinary tool configuration per AGENTS.md §"Local memory guardrail
// policy" — documented as configuration rather than memory. Keep the two in
// sync: the policy is the human-readable record, this is its enforcement.
const ORDINARY_EXACT_PATHS = [
  // Claude Code project settings (plugin marketplaces/enablement); the rest
  // of .claude/** stays prohibited.
  ".claude/settings.json",
  ".prettierrc.json",
  ".prettierignore",
  ".livespec.jsonc",
] as const;

const ORDINARY_PREFIXES = [
  ".ai/", // the sanctioned agent-notes directory (rules below)
  ".githooks/", // committed hooks installed by bootstrap
  ".github/", // CI workflows (slice 6, li-xjjeqo)
  ".idea/", // JetBrains project configuration; state is gitignored within
] as const;

const ORDINARY_BASENAMES = [
  ".gitignore",
  ".gitattributes",
  ".gitkeep",
  ".editorconfig",
] as const;

const AI_NOTE_PATTERN = /^\.ai\/[^/]+\.md$/;
const AI_REFERENCE_PATTERN = /\.ai\/[A-Za-z0-9._-]+\.md/g;

function isOrdinaryToolConfiguration(path: string): boolean {
  if (ORDINARY_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return true;
  }
  if ((ORDINARY_EXACT_PATHS as readonly string[]).includes(path)) {
    return true;
  }
  const segments = path.split("/");
  const firstHidden = segments.findIndex((s) => s.startsWith("."));
  const basename = segments[segments.length - 1] ?? "";
  return (
    firstHidden === segments.length - 1 &&
    (ORDINARY_BASENAMES as readonly string[]).includes(basename)
  );
}

// referenceExists widens the dangling-reference check beyond the path list:
// tree mode passes a disk probe so a freshly created, not-yet-staged note is
// not reported missing; staged mode omits it, because a commit whose index
// lacks a referenced note IS dangling regardless of the working tree.
export function findMemoryViolations(
  paths: readonly string[],
  agentsIndex: string,
  referenceExists?: (reference: string) => boolean,
): string[] {
  const violations: string[] = [];
  const pathSet = new Set(paths);
  for (const path of paths) {
    const segments = path.split("/");
    if (segments.some((s) => s.startsWith(".aider"))) {
      violations.push(
        `${path} — .aider* state files are a prohibited private-memory path`,
      );
      continue;
    }
    const prohibited = PROHIBITED_TOOL_STATE_PREFIXES.find((prefix) =>
      path.startsWith(prefix),
    );
    if (
      prohibited !== undefined &&
      !(ORDINARY_EXACT_PATHS as readonly string[]).includes(path)
    ) {
      violations.push(
        `${path} — ${prohibited}** is a prohibited hidden tool-state path`,
      );
      continue;
    }
    if (
      prohibited === undefined &&
      segments.some((s) => s.startsWith(".")) &&
      !isOrdinaryToolConfiguration(path)
    ) {
      violations.push(
        `${path} — hidden path is not documented as ordinary tool ` +
          'configuration (AGENTS.md §"Local memory guardrail policy")',
      );
      continue;
    }
    if (path.startsWith(".ai/")) {
      if (!AI_NOTE_PATTERN.test(path)) {
        violations.push(
          `${path} — only flat .ai/*.md notes are allowed under .ai/`,
        );
      } else if (!agentsIndex.includes(path)) {
        violations.push(`${path} — .ai note is not indexed from AGENTS.md`);
      }
    }
  }
  const referenced = new Set(
    [...agentsIndex.matchAll(AI_REFERENCE_PATTERN)].map((match) => match[0]),
  );
  for (const reference of referenced) {
    if (!pathSet.has(reference) && !(referenceExists?.(reference) ?? false)) {
      violations.push(
        `AGENTS.md references ${reference}, which is missing from the tree`,
      );
    }
  }
  return violations;
}

function sh(
  cwd: string,
  cmd: readonly string[],
): { exitCode: number | null; stdout: string; stderr: string } {
  const run = Bun.spawnSync({ cmd: [...cmd], cwd });
  return {
    exitCode: run.exitCode,
    stdout: run.stdout.toString(),
    stderr: run.stderr.toString(),
  };
}

function gitTrackedPaths(root: string): string[] {
  const res = sh(root, ["git", "ls-files"]);
  if (res.exitCode !== 0) {
    console.error(`precondition failure: git ls-files failed: ${res.stderr}`);
    process.exit(3);
  }
  return res.stdout.split("\n").filter((line) => line.length > 0);
}

function walkPaths(root: string, prefix = ""): string[] {
  const paths: string[] = [];
  for (const entry of readdirSync(join(root, prefix), {
    withFileTypes: true,
  })) {
    if (entry.isSymbolicLink()) {
      continue;
    }
    const relPath = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") {
        continue;
      }
      paths.push(...walkPaths(root, relPath));
    } else {
      paths.push(relPath);
    }
  }
  return paths;
}

function usage(): never {
  console.error(
    "usage: bun scripts/check-memory.ts [--staged] [--project-root <path>]",
  );
  process.exit(2);
}

if (import.meta.main) {
  let staged = false;
  let root = process.cwd();
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--staged") {
      staged = true;
    } else if (arg === "--project-root") {
      const value = argv[i + 1];
      if (value === undefined) {
        usage();
      }
      root = resolve(value);
      i += 1;
    } else {
      usage();
    }
  }

  let paths: string[];
  let agentsIndex: string;
  if (staged) {
    if (!existsSync(join(root, ".git"))) {
      console.error(
        "precondition failure: --staged requires a git repository at the project root",
      );
      process.exit(3);
    }
    paths = gitTrackedPaths(root);
    const show = sh(root, ["git", "show", ":AGENTS.md"]);
    agentsIndex = show.exitCode === 0 ? show.stdout : "";
  } else if (existsSync(join(root, ".git"))) {
    paths = gitTrackedPaths(root);
    const agentsPath = join(root, "AGENTS.md");
    agentsIndex = existsSync(agentsPath)
      ? readFileSync(agentsPath, "utf8")
      : "";
  } else {
    paths = walkPaths(root);
    const agentsPath = join(root, "AGENTS.md");
    agentsIndex = existsSync(agentsPath)
      ? readFileSync(agentsPath, "utf8")
      : "";
  }

  const violations = findMemoryViolations(
    paths,
    agentsIndex,
    staged ? undefined : (reference) => existsSync(join(root, reference)),
  );
  if (violations.length > 0) {
    console.error(
      `local memory guardrail: REJECTED — ${String(violations.length)} violation(s):`,
    );
    for (const violation of violations) {
      console.error(`  - ${violation}`);
    }
    console.error(
      "Policy: SPECIFICATION/non-functional-requirements.md " +
        '§"Local memory guardrails" and AGENTS.md §"Local memory guardrail policy".',
    );
    process.exit(1);
  }
  console.log(
    `local memory guardrail: clean (${String(paths.length)} paths checked${staged ? ", staged tree" : ""}).`,
  );
}
