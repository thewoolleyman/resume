#!/usr/bin/env bun
// session-plugin-freshness — Claude Code SessionStart hook.
//
// Standalone TypeScript stand-in for the fleet's `just ensure-plugins`
// SessionStart step, per SPECIFICATION/non-functional-requirements.md §"Hooks"
// and constraints.md §"Standalone boundary". NON-BLOCKING: surfaces a warning
// (as session context) when this project's pinned livespec plugin build is
// OLDER than the newest livespec build present in the local plugin cache — the
// exact drift that shipped a stale build (f906c7481cb4 vs dd9ae4ce7219) into a
// prior session. It never fails session start (fail-open on any error) and
// never mutates anything; it only tells the operator to reload plugins.
//
// Wire-up (.claude/settings.json): a SessionStart hook whose command is
// `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/session-plugin-freshness.ts"`.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

interface InstalledEntry {
  installPath?: string;
  projectPath?: string;
  version?: string;
}

// Returns a warning string when the project's pinned build is older than the
// newest cached build, else null.
export function stalenessWarning(
  installed: Record<string, InstalledEntry[]>,
  cacheRoot: string,
  projectDir: string,
  mtimeOf: (path: string) => number,
): string | null {
  const entries = installed["livespec@livespec"];
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }
  const mine =
    entries.find((e) => e.projectPath === projectDir) ?? undefined;
  if (!mine?.installPath) {
    return null;
  }
  const myBuild = mine.installPath.split("/").filter(Boolean).pop() ?? "";
  if (myBuild.length === 0 || !existsSync(cacheRoot)) {
    return null;
  }
  const builds = readdirSync(cacheRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  if (!builds.includes(myBuild)) {
    return null;
  }
  const myMtime = mtimeOf(join(cacheRoot, myBuild));
  let newest = myBuild;
  let newestMtime = myMtime;
  for (const b of builds) {
    const m = mtimeOf(join(cacheRoot, b));
    if (m > newestMtime) {
      newest = b;
      newestMtime = m;
    }
  }
  if (newest === myBuild) {
    return null;
  }
  return (
    `livespec plugin may be STALE: this project is pinned to build ${myBuild}, ` +
    `but a newer build ${newest} exists in the local cache. If livespec ` +
    "operations misbehave, reload plugins (or restart Claude Code) so the " +
    "pinned release build is used."
  );
}

if (import.meta.main) {
  try {
    const home = process.env.HOME ?? "";
    const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
    if (home.length === 0) {
      process.exit(0);
    }
    const installedPath = join(
      home,
      ".claude",
      "plugins",
      "installed_plugins.json",
    );
    if (!existsSync(installedPath)) {
      process.exit(0);
    }
    const installed = JSON.parse(readFileSync(installedPath, "utf8")) as {
      plugins?: Record<string, InstalledEntry[]>;
    };
    const cacheRoot = join(
      home,
      ".claude",
      "plugins",
      "cache",
      "livespec",
      "livespec",
    );
    const warning = stalenessWarning(
      installed.plugins ?? {},
      cacheRoot,
      projectDir,
      (p) => (existsSync(p) ? statSync(p).mtimeMs : 0),
    );
    if (warning !== null) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "SessionStart",
            additionalContext: `[session-plugin-freshness] ${warning}`,
          },
        }),
      );
    }
    process.exit(0);
  } catch {
    process.exit(0); // fail open — never wedge session start
  }
}
