#!/usr/bin/env bun
// subagent-stop-guard — Claude Code SubagentStop hook.
//
// Standalone TypeScript port of the fleet's subagent_stop_guard, per
// SPECIFICATION/non-functional-requirements.md §"Hooks" and constraints.md
// §"Standalone boundary". Blocks a sub-agent turn-end while a worktree the
// sub-agent CREATED still holds uncommitted or unpushed work — so a one-shot
// executor cannot strand a half-finished land (unpushed commits, dirty tree).
//
// Marker derivation is fully DERIVED (no sentinel files):
//   1. Scope: absolute worktree paths created by THIS sub-agent, parsed from
//      `git worktree add ... <path>` commands in the transcript, restricted to
//      the fleet new-root form `**/.worktrees/<repo>/<branch>`. A sub-agent
//      that never created such a worktree yields no candidates and is never
//      blocked.
//   2. Per worktree that still exists, first marker wins: uncommitted tracked
//      changes, then unpushed commits.
//
// Fail-open on any error (a broken hook must never wedge a healthy agent).
// `stop_hook_active` short-circuits to allow, so the block cannot loop.
//
// Wire-up (.claude/settings.json): a SubagentStop hook whose command is
// `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/subagent-stop-guard.ts"`.

import { existsSync, readFileSync } from "node:fs";

const WORKTREES_INFIX = "/.worktrees/";
const MAX_WORKTREES = 32; // runaway backstop

// Extract absolute worktree paths from `git worktree add ... <path>` commands,
// restricted to the `**/.worktrees/<repo>/<branch>` form. $HOME / ~ are
// expanded from the environment.
export function worktreePathsFromTranscript(
  transcript: string,
  home: string,
): string[] {
  const paths = new Set<string>();
  // Match a `git worktree add` invocation and capture the first token that
  // contains `/.worktrees/` (quoted or bare, with $HOME / ~ prefixes).
  const addRe = /git\s+worktree\s+add\b[^\n]*/g;
  const pathRe = /(?:"|')?((?:\$HOME|~|\/)[^\s"']*\/\.worktrees\/[^\s"']+)(?:"|')?/;
  for (const m of transcript.matchAll(addRe)) {
    const pm = pathRe.exec(m[0]);
    if (!pm) {
      continue;
    }
    let p = pm[1];
    p = p.replace(/^\$HOME/, home).replace(/^~/, home);
    // Require the two-segment fleet form: .../.worktrees/<repo>/<branch>
    const rest = p.slice(p.indexOf(WORKTREES_INFIX) + WORKTREES_INFIX.length);
    const segs = rest.split("/").filter((s) => s.length > 0);
    if (segs.length >= 2) {
      paths.add(p);
    }
    if (paths.size >= MAX_WORKTREES) {
      break;
    }
  }
  return [...paths];
}

function sh(cwd: string, cmd: string[]): { code: number | null; out: string } {
  const r = Bun.spawnSync({ cmd, cwd });
  return { code: r.exitCode, out: r.stdout.toString().trim() };
}

// Returns an in-flight marker string for a worktree, or null if clean/gone.
export function inFlightMarker(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }
  const dirty = sh(path, ["git", "status", "--porcelain", "-uno"]);
  if (dirty.code === 0 && dirty.out.length > 0) {
    return `${path}: uncommitted tracked changes`;
  }
  const unpushed = sh(path, [
    "git",
    "rev-list",
    "--count",
    "HEAD",
    "--not",
    "--remotes=origin",
  ]);
  if (unpushed.code === 0 && /^[1-9]/.test(unpushed.out)) {
    return `${path}: ${unpushed.out} unpushed commit(s)`;
  }
  return null;
}

export function collectMarkers(transcript: string, home: string): string[] {
  const markers: string[] = [];
  for (const p of worktreePathsFromTranscript(transcript, home)) {
    const marker = inFlightMarker(p);
    if (marker !== null) {
      markers.push(marker);
    }
  }
  return markers;
}

if (import.meta.main) {
  try {
    const raw = await Bun.stdin.text();
    if (raw.trim().length === 0) {
      process.exit(0);
    }
    const data = JSON.parse(raw) as {
      transcript_path?: string;
      stop_hook_active?: boolean;
    };
    if (data.stop_hook_active === true) {
      process.exit(0); // already blocked once — do not loop
    }
    const tp = data.transcript_path;
    if (!tp || !existsSync(tp)) {
      process.exit(0);
    }
    const home = process.env.HOME ?? "";
    if (home.length === 0) {
      process.exit(0); // cannot resolve worktree paths → fail open
    }
    const markers = collectMarkers(readFileSync(tp, "utf8"), home);
    if (markers.length > 0) {
      const reason =
        "Do NOT end this turn: a worktree you created still holds unlanded " +
        "work. Finish the land (commit, then fast-forward push to master, then " +
        "remove the worktree and delete the branch) before stopping:\n" +
        markers.map((m) => `  - ${m}`).join("\n");
      process.stdout.write(JSON.stringify({ decision: "block", reason }));
      process.exit(0);
    }
    process.exit(0);
  } catch {
    process.exit(0); // fail open
  }
}
