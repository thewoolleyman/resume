// The comment-discipline gate — `bun run check` (in-process) and standalone as
// `bun scripts/check-comments.ts` — per SPECIFICATION/non-functional-requirements.md
// §"Comment discipline" Rule 2 (no historical-bookkeeping references) plus the
// line-number-anchor ban. It scans the comments and docstrings — never string
// literals — of in-scope first-party source, so functional data (fixture arrays,
// excluded-path strings) is untouched.
//
// Scope: first-party code trees plus the named configuration files. The exempt
// trees (SPECIFICATION, plan, archive, generated) are simply never included.
// Comment text is extracted lexically: for TypeScript/JavaScript/JSON-family
// files via the pinned TypeScript scanner (string and template literals tokenise
// separately, so they are out of scope); for YAML via the hash-comment lexer;
// Svelte adds HTML-comment extraction on top of the scanner.
//
// Rule 1 (WHY-not-WHAT) is judgment-based per the spec and is deliberately NOT
// mechanised here — code review is its gate. The phase/cycle markers in
// livespec's own regex are intentionally omitted: "phase" is ratified
// delivery-phase vocabulary in this project (spec.md §"Delivery phases"), not a
// bookkeeping marker.
//
// Exit codes per §"Exit-code baseline": 0 clean, 1 violations found, 3
// precondition failure (git unavailable / not a repo).

import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import ts from "typescript";

// In-scope tracked paths: these prefixes, plus the named root configuration
// files. Exempt trees are excluded by never matching here.
const INCLUDE_PREFIXES = [
  "scripts/",
  "src/",
  "e2e/",
  ".github/workflows/",
] as const;

const INCLUDE_ROOT_FILES = new Set<string>([
  ".livespec.jsonc",
  "eslint.config.js",
  "tsconfig.json",
  "svelte.config.js",
  "vite.config.ts",
  "vitest.config.ts",
  "playwright.config.ts",
]);

const TS_LIKE = new Set([
  ".ts",
  ".mts",
  ".cts",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
]);
const YAML_LIKE = new Set([".yml", ".yaml"]);
const SVELTE = ".svelte";

// Rule 2 banned markers, adapted to this repository's breadcrumb forms. Each
// name labels the violation; the pattern matches the marker inside comment text.
// The livespec enumerated set is extended with work-item ids, plan-thread paths,
// design-document slice references, and commit/merge SHAs; phase/cycle markers
// are omitted (see the header note).
const BANNED_PATTERNS: readonly {
  readonly name: string;
  readonly re: RegExp;
}[] = [
  { name: "spec version marker", re: /\bv\d{3}\b/ },
  { name: "work-item id", re: /\bli-[a-z0-9]{5,}\b/ },
  { name: "plan-thread path", re: /\bplan\/[a-z0-9][a-z0-9-]*/ },
  { name: "design-document reference", re: /\bfindings\.md\b|\bslice\s+\d+\b/ },
  {
    name: "commit reference",
    re: /\bthis commit\b|\bthe previous (?:commit|pr)\b|\b(?:merge|commit|landed(?:\s+(?:at|in))?)\s+[0-9a-f]{7,40}\b/i,
  },
  {
    name: "commit sha",
    re: /\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{7,40}\b/,
  },
  { name: "pull-request number", re: /\b(?:pr|pull request)\s*#?\d+\b/i },
  { name: "bookkeeping phrase", re: /\bwatcher\b/i },
  {
    name: "line-number anchor",
    re: /\blines?\s+~?\d+(?:\s*[-–—]\s*\d+)?\b/i,
  },
];

export interface CommentViolation {
  readonly file: string;
  readonly line: number;
  readonly marker: string;
  readonly text: string;
}

export interface CommentDisciplineResult {
  readonly ok: boolean;
  readonly violations: readonly CommentViolation[];
}

interface ExtractedComment {
  readonly line: number;
  readonly text: string;
}

function lineOf(source: string, pos: number): number {
  let line = 1;
  for (let i = 0; i < pos && i < source.length; i += 1) {
    if (source[i] === "\n") {
      line += 1;
    }
  }
  return line;
}

// Parses TS/JS/JSON-family text and returns only comment trivia. Walking the
// parsed tree and collecting each node's leading/trailing comment ranges is
// robust to template literals and regex-vs-division ambiguity that a raw token
// scan mishandles; string and template literals are node content, never comment
// ranges, so they stay out of scope.
function extractScannerComments(source: string): ExtractedComment[] {
  const sourceFile = ts.createSourceFile(
    "scan.ts",
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
  );
  const seen = new Set<number>();
  const comments: ExtractedComment[] = [];
  const addRanges = (ranges: readonly ts.CommentRange[] | undefined): void => {
    if (!ranges) {
      return;
    }
    for (const range of ranges) {
      if (seen.has(range.pos)) {
        continue;
      }
      seen.add(range.pos);
      comments.push({
        line: lineOf(source, range.pos),
        text: source.slice(range.pos, range.end),
      });
    }
  };
  const visit = (node: ts.Node): void => {
    addRanges(ts.getLeadingCommentRanges(source, node.pos));
    addRanges(ts.getTrailingCommentRanges(source, node.end));
    node.forEachChild(visit);
  };
  visit(sourceFile);
  addRanges(ts.getLeadingCommentRanges(source, sourceFile.endOfFileToken.pos));
  return comments;
}

// YAML comments: the run following an unquoted `#` at line start or after
// whitespace. A `#` embedded in a token (e.g. a URL fragment) is not a comment.
function extractYamlComments(source: string): ExtractedComment[] {
  const comments: ExtractedComment[] = [];
  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const match = /(?:^|\s)#(.*)$/.exec(lines[i] ?? "");
    if (match) {
      comments.push({ line: i + 1, text: match[1] ?? "" });
    }
  }
  return comments;
}

// HTML comments in Svelte markup, which the TS scanner does not model.
function extractHtmlComments(source: string): ExtractedComment[] {
  const comments: ExtractedComment[] = [];
  const re = /<!--([\s\S]*?)-->/g;
  let match: RegExpExecArray | null = re.exec(source);
  while (match !== null) {
    comments.push({ line: lineOf(source, match.index), text: match[1] ?? "" });
    match = re.exec(source);
  }
  return comments;
}

function extractComments(source: string, ext: string): ExtractedComment[] {
  if (ext === SVELTE) {
    return [...extractScannerComments(source), ...extractHtmlComments(source)];
  }
  if (YAML_LIKE.has(ext)) {
    return extractYamlComments(source);
  }
  if (TS_LIKE.has(ext)) {
    return extractScannerComments(source);
  }
  return [];
}

function isInScope(path: string): boolean {
  if (INCLUDE_ROOT_FILES.has(path)) {
    return true;
  }
  return INCLUDE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isParseable(path: string): boolean {
  const ext = extname(path);
  return ext === SVELTE || YAML_LIKE.has(ext) || TS_LIKE.has(ext);
}

// Tracked in-scope, parseable files. `git ls-files` keeps untracked scratch out.
function inScopeFiles(root: string): string[] {
  const run = Bun.spawnSync({ cmd: ["git", "ls-files"], cwd: root });
  if (run.exitCode !== 0) {
    throw new Error(`git ls-files failed: ${run.stderr.toString().trim()}`);
  }
  return run.stdout
    .toString()
    .split("\n")
    .filter((path) => path.length > 0 && isInScope(path) && isParseable(path));
}

export function checkComments(root: string): CommentDisciplineResult {
  const violations: CommentViolation[] = [];
  for (const relPath of inScopeFiles(root)) {
    const source = readFileSync(resolve(root, relPath), "utf8");
    const ext = extname(relPath);
    for (const comment of extractComments(source, ext)) {
      for (const pattern of BANNED_PATTERNS) {
        const hit = pattern.re.exec(comment.text);
        if (hit) {
          violations.push({
            file: relPath,
            line: comment.line,
            marker: pattern.name,
            text: hit[0],
          });
        }
      }
    }
  }
  return { ok: violations.length === 0, violations };
}

function parseProjectRoot(argv: readonly string[]): string {
  const index = argv.indexOf("--project-root");
  if (index === -1) {
    return process.cwd();
  }
  const value = argv[index + 1];
  if (value === undefined) {
    console.error(
      "usage: bun scripts/check-comments.ts [--project-root <path>]",
    );
    process.exit(2);
  }
  return resolve(value);
}

if (import.meta.main) {
  const root = parseProjectRoot(process.argv.slice(2));
  let result: CommentDisciplineResult;
  try {
    result = checkComments(root);
  } catch (error) {
    console.error(`precondition failure: ${(error as Error).message}`);
    process.exit(3);
  }
  if (!result.ok) {
    console.error(
      `comment-discipline: REJECTED — ${String(result.violations.length)} rotting reference(s) in source comments:`,
    );
    for (const violation of result.violations) {
      console.error(
        `  ${violation.file}:${String(violation.line)}: ${violation.marker} (${violation.text})`,
      );
    }
    console.error(
      "State the live constraint in present tense; provenance belongs in " +
        "SPECIFICATION/history/, git log, and proposed-change files, not in source comments.",
    );
    process.exit(1);
  }
  console.log(
    "comment-discipline: clean (no rotting historical references in in-scope source comments).",
  );
}
