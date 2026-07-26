#!/usr/bin/env bun
// ensure-plugins — Claude Code SessionStart hook.
//
// Standalone TypeScript provisioner for the Claude plugins this project
// declares, per SPECIFICATION/non-functional-requirements.md §"Hooks" and
// constraints.md §"Standalone boundary". It is the mutating counterpart to
// session-plugin-freshness.ts, which only WARNS about a stale build and by
// contract never mutates anything.
//
// Why a provisioning hook is needed at all: registering a plugin in
// .claude/settings.json (`extraKnownMarketplaces` + `enabledPlugins`) is only
// a DECLARATION. Claude Code does not install from those keys on its own, so a
// project that declares a plugin and runs no provisioner has that plugin's
// skills resolve in no session.
//
// The commands are DERIVED from .claude/settings.json rather than listed here,
// so the declared set has one source of truth and enabling another plugin
// needs no change to this hook:
//
//   1. claude plugin marketplace update           — refresh catalogs first
//   2. claude plugin marketplace add <repo>@<ref>  — per marketplace entry
//   3. claude plugin install <plugin> -s project   — per enabled plugin
//      claude plugin update  <plugin> -s project
//
// `install` is not optional: `claude plugin update` on a plugin that was never
// installed does nothing at all, so an update-only provisioner keeps an
// already-installed set current but can never provision a new plugin.
//
// This is a HARNESS concern only — it provisions the operator's Claude Code
// plugin surface and is not a discovery input for any plugin's own runtime.
//
// Two CLI behaviors it depends on, both measured rather than assumed:
//   - `-s project` resolves the project from the PROCESS CWD and ignores
//     CLAUDE_PROJECT_DIR, so the project directory is passed as each command's
//     cwd explicitly rather than inherited. Run from elsewhere, the CLI exits 0
//     having recorded the install against the wrong project, or none at all.
//   - `install` and `uninstall` REWRITE .claude/settings.json — `install` adds
//     the `enabledPlugins` key, `uninstall` removes it — and both re-serialize
//     the whole file in the CLI's own canonical formatting. The committed file
//     is kept in that shape so provisioning leaves the tree clean.
//
// Fail-open contract: ANY failure — absent or malformed settings, a missing
// `claude` binary, a non-zero command — exits 0, and one failing command never
// aborts the commands after it. Session start must not be wedged because
// provisioning could not complete.
//
// `--print-plan` writes the derived commands to stdout and runs none of them,
// which is how the harness tests assert the plan without invoking the CLI.
//
// Wire-up (.claude/settings.json): a SessionStart hook whose command is
// `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/ensure-plugins.ts"`.

import { readFileSync } from "node:fs";
import { join } from "node:path";

interface MarketplaceSource {
  source?: unknown;
  repo?: unknown;
  ref?: unknown;
}

interface Settings {
  extraKnownMarketplaces?: Record<string, { source?: MarketplaceSource }>;
  enabledPlugins?: Record<string, unknown> | unknown[];
}

// `repo` and `ref` live under the entry's nested `source` object, never at the
// entry's top level. A top-level read yields undefined for every entry, which
// reads as "nothing pins a ref" — the opposite of the truth.
function marketplaceTarget(entry: {
  source?: MarketplaceSource;
}): string | null {
  const source = entry?.source;
  if (source?.source !== "github") {
    return null;
  }
  const { repo, ref } = source;
  if (typeof repo !== "string" || typeof ref !== "string" || !repo || !ref) {
    return null;
  }
  return `${repo}@${ref}`;
}

function enabledPluginNames(raw: Settings["enabledPlugins"]): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((name): name is string => typeof name === "string");
  }
  if (raw === null || typeof raw !== "object") {
    return [];
  }
  return Object.entries(raw)
    .filter(([, value]) => value === true)
    .map(([name]) => name);
}

// Returns the argv tails (everything after `claude`) derived from a settings
// body. An unparsable body yields an empty list, so a malformed settings file
// provisions nothing rather than throwing into session start.
export function plannedCommands(settingsText: string): string[][] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(settingsText);
  } catch {
    return [];
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [];
  }
  const settings = parsed as Settings;
  const commands: string[][] = [["plugin", "marketplace", "update"]];
  for (const entry of Object.values(settings.extraKnownMarketplaces ?? {})) {
    const target = marketplaceTarget(entry);
    if (target !== null) {
      commands.push(["plugin", "marketplace", "add", target]);
    }
  }
  for (const plugin of enabledPluginNames(settings.enabledPlugins)) {
    commands.push(["plugin", "install", plugin, "-s", "project"]);
    commands.push(["plugin", "update", plugin, "-s", "project"]);
  }
  return commands;
}

if (import.meta.main) {
  try {
    const projectDir =
      process.env.CLAUDE_PROJECT_DIR ?? join(import.meta.dir, "..", "..");
    let settingsText: string;
    try {
      settingsText = readFileSync(
        join(projectDir, ".claude", "settings.json"),
        "utf8",
      );
    } catch {
      process.exit(0);
    }
    const planned = plannedCommands(settingsText);
    if (process.argv.includes("--print-plan")) {
      for (const args of planned) {
        process.stdout.write(`claude ${args.join(" ")}\n`);
      }
      process.exit(0);
    }
    for (const args of planned) {
      try {
        Bun.spawnSync({
          cmd: ["claude", ...args],
          cwd: projectDir,
          stdout: "ignore",
          stderr: "ignore",
        });
      } catch {
        continue; // one unreachable marketplace must not block the others
      }
    }
    process.exit(0);
  } catch {
    process.exit(0); // fail open — never wedge session start
  }
}
