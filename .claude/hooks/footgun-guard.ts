#!/usr/bin/env bun
// footgun-guard — Claude Code PreToolUse hook (Bash).
//
// Standalone TypeScript port of the livespec fleet's footgun guard, adapted
// for this repo per SPECIFICATION/non-functional-requirements.md §"Hooks" and
// constraints.md §"Standalone boundary" (no dependency on livespec fleet
// Python tooling). Blocks ONLY patterns that are NEVER legitimate here:
//   - `git ... commit/push ... --no-verify`  (bypasses the committed
//     core.hooksPath gates: TDD commit-msg + memory pre-commit)
//   - `git ... config core.bare <true>`      (set; NOT --get/--unset/--list)
//   - a Bash WRITE into the Claude auto-memory store
//     (~/.claude/projects/<slug>/memory/) via redirect / tee / cp / mv / dd /
//     sed -i / here-doc
// each with an actionable deny message naming the correct alternative.
//
// Detection is TOKEN/SEGMENT based, not substring based: the dangerous strings
// frequently appear as DATA (an echo, a grep, a here-doc body, a commit
// message) and MUST NOT be blocked. For each `&&`/`||`/`;`/`|`/newline segment
// we strip here-doc bodies, leading env-assignments, and `mise exec --` /
// `sudo` / `env` wrappers, then inspect only the resulting git invocation.
//
// Always exits 0; the git-footgun checks fail OPEN on any parse error (a guard
// bug must never block legitimate work — the committed hooks are the real
// backstop). The memory-write rule fails CLOSED on detection.
//
// Wire-up (.claude/settings.json): a PreToolUse hook with matcher "Bash" whose
// command is `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/footgun-guard.ts"`.

const NO_VERIFY_REASON =
  "NEVER use --no-verify. The committed .githooks gates (the TDD Red -> Green " +
  "commit-msg gate and the memory pre-commit guard, installed via " +
  "core.hooksPath) are load-bearing. If a hook rejects a commit, READ the " +
  "rejection and fix the ROOT CAUSE, or HALT and ask the user — do not bypass.";

const CORE_BARE_REASON =
  "NEVER set core.bare=true on a primary checkout — it is a regression the " +
  "worktree-mandatory policy forbids. Author changes in a secondary worktree " +
  'via `git worktree add -b <branch> "$HOME/.worktrees/resume/<branch>" master`.';

const MEMORY_WRITE_REASON =
  "NEVER write to the Claude auto-memory store " +
  "(~/.claude/projects/<project>/memory/) via Bash. Durable, cross-session " +
  "guidance lives in the repo's AGENTS.md (Claude loads it through the " +
  ".claude/CLAUDE.md symlink); trackable items are filed through the beads " +
  "work-item flow. Do NOT recreate or append to the store with redirects / " +
  "tee / cp / mv / dd / sed -i / heredocs — the Write/Edit tool is already " +
  "governed for memory paths and this rule closes the shell bypass.";

const ENV_ASSIGN = /^[A-Za-z_][A-Za-z0-9_]*=/;
const GIT_GLOBAL_OPTS_WITH_ARG = new Set([
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--exec-path",
]);
const SEGMENT_SPLIT = /&&|\|\||;|\||\n/;
const HEREDOC = /<<-?\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?/;

// A path under the Claude per-project auto-memory store, generic over the slug.
const MEM_PATH = "\\.claude/projects/[^/\\s'\"|&;<>]+/memory/";

const MEM_WRITE_PATTERNS: RegExp[] = [
  new RegExp(">>?\\|?\\s*[^\\s|&;<>]*" + MEM_PATH),
  new RegExp("\\btee\\b[^|&;<>]*" + MEM_PATH),
  new RegExp("\\btruncate\\b[^|&;<>]*" + MEM_PATH),
  new RegExp("\\bdd\\b[^|&;<>]*\\bof=[^\\s|&;<>]*" + MEM_PATH),
  new RegExp("\\bsed\\b[^|&;<>]*(?:-i|--in-place)[^|&;<>]*" + MEM_PATH),
  new RegExp(
    "\\b(?:cp|mv|rsync|install|ln)\\b\\s+[^\\s|&;<>]+\\s+[^|&;<>]*" + MEM_PATH,
  ),
];

// Remove here-doc BODIES (file data, not executed commands): keep the
// introducing line, drop from the next line through the terminator.
export function stripHeredocBodies(command: string): string {
  const lines = command.split("\n");
  const out: string[] = [];
  let i = 0;
  const n = lines.length;
  while (i < n) {
    const line = lines[i] ?? "";
    out.push(line);
    const m = HEREDOC.exec(line);
    if (m) {
      const term = m[1];
      i += 1;
      while (i < n && (lines[i] ?? "").trim() !== term) {
        i += 1;
      }
      if (i < n) {
        i += 1;
      }
      continue;
    }
    i += 1;
  }
  return out.join("\n");
}

export function segments(command: string): string[] {
  return stripHeredocBodies(command)
    .split(SEGMENT_SPLIT)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Minimal POSIX-ish tokenizer: honors single/double quotes and backslash
// escapes; throws on an unterminated quote so the caller can fail open.
export function tokenize(segment: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quote: '"' | "'" | null = null;
  let has = false;
  for (let i = 0; i < segment.length; i += 1) {
    const ch = segment[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else if (quote === '"' && ch === "\\" && i + 1 < segment.length) {
        i += 1;
        cur += segment[i];
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
    } else if (ch === "\\" && i + 1 < segment.length) {
      i += 1;
      cur += segment[i];
      has = true;
    } else if (ch === " " || ch === "\t") {
      if (has) {
        tokens.push(cur);
        cur = "";
        has = false;
      }
    } else {
      cur += ch;
      has = true;
    }
  }
  if (quote) {
    throw new Error("unterminated quote");
  }
  if (has) {
    tokens.push(cur);
  }
  return tokens;
}

// Strip leading VAR=val env-assignments and `mise exec [--]` / `sudo` / `env`
// wrappers, so only the executed leading command is inspected.
export function stripLeadingNoise(tokens: string[]): string[] {
  let i = 0;
  const n = tokens.length;
  while (i < n && ENV_ASSIGN.test(tokens[i] ?? "")) {
    i += 1;
  }
  let changed = true;
  while (changed && i < n) {
    changed = false;
    const base = (tokens[i] ?? "").split("/").pop() ?? "";
    if (base === "sudo" || base === "env") {
      i += 1;
      changed = true;
      while (i < n && ENV_ASSIGN.test(tokens[i] ?? "")) {
        i += 1;
      }
      continue;
    }
    if (base === "mise") {
      let j = i + 1;
      while (
        (j < n && tokens[j] !== "--" && (tokens[j] === "exec" || tokens[j] === "x")) ||
        (j < n && (tokens[j] ?? "").startsWith("-"))
      ) {
        j += 1;
      }
      i = j;
      changed = true;
      continue;
    }
  }
  return tokens.slice(i);
}

// If tokens is a git invocation, return [subcommand, argsAfterSubcommand].
export function gitSubcommand(tokens: string[]): [string | null, string[]] {
  if (tokens.length === 0) {
    return [null, []];
  }
  if (((tokens[0] ?? "").split("/").pop() ?? "") !== "git") {
    return [null, []];
  }
  let i = 1;
  const n = tokens.length;
  while (i < n) {
    const t = tokens[i] ?? "";
    if (t === "--") {
      i += 1;
      break;
    }
    if (!t.startsWith("-")) {
      break;
    }
    i += 1;
    if (GIT_GLOBAL_OPTS_WITH_ARG.has(t) && i < n) {
      i += 1;
    }
  }
  if (i >= n) {
    return [null, []];
  }
  return [tokens[i] ?? null, tokens.slice(i + 1)];
}

export function memoryWriteReason(segment: string): string | null {
  return MEM_WRITE_PATTERNS.some((p) => p.test(segment))
    ? MEMORY_WRITE_REASON
    : null;
}

// Returns the deny reason for a git footgun in this segment, or null.
export function checkSegment(segment: string): string | null {
  let tokens: string[];
  try {
    tokens = tokenize(segment);
  } catch {
    return null; // unparseable → fail open
  }
  const core = stripLeadingNoise(tokens);
  const [sub, args] = gitSubcommand(core);
  if (sub === null) {
    return null;
  }
  if ((sub === "commit" || sub === "push") && args.includes("--no-verify")) {
    return NO_VERIFY_REASON;
  }
  if (sub === "config") {
    if (
      args.some((a) =>
        ["--get", "--unset", "--list", "--get-all", "--unset-all"].includes(a),
      )
    ) {
      return null;
    }
    const joined = args.join(" ");
    if (/\bcore\.bare\b/.test(joined) && /\b(?:true|1|yes|on)\b/i.test(joined)) {
      return CORE_BARE_REASON;
    }
  }
  return null;
}

// Evaluate a full Bash command; return the deny reason or null.
export function evaluateCommand(command: string): string | null {
  for (const seg of segments(command)) {
    const mem = memoryWriteReason(seg);
    if (mem !== null) {
      return mem;
    }
    const git = checkSegment(seg);
    if (git !== null) {
      return git;
    }
  }
  return null;
}

function deny(reason: string, command: string): void {
  const payload = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        `BLOCKED by footgun-guard.ts\n\n${reason}\n\n` +
        `Command: ${command}\n\n` +
        "This block is NOT a transient/transport failure. Do NOT retry the " +
        "same command. Use the named alternative, or stop and ask the user. " +
        "If this is a FALSE positive, tighten .claude/hooks/footgun-guard.ts.",
    },
  };
  process.stdout.write(JSON.stringify(payload));
  process.exit(0);
}

if (import.meta.main) {
  try {
    const raw = await Bun.stdin.text();
    if (raw.trim().length === 0) {
      process.exit(0);
    }
    const data = JSON.parse(raw) as {
      tool_name?: string;
      tool_input?: { command?: string };
    };
    if (data.tool_name !== "Bash") {
      process.exit(0);
    }
    const command = data.tool_input?.command ?? "";
    if (command.length === 0) {
      process.exit(0);
    }
    const reason = evaluateCommand(command);
    if (reason !== null) {
      deny(reason, command);
    }
    process.exit(0);
  } catch {
    process.exit(0); // fail open on any unexpected error
  }
}
