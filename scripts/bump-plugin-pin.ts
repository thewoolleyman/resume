#!/usr/bin/env bun
// bump-plugin-pin — advance this project's Claude plugin marketplace pin to a
// newly released tag.
//
// This project is a version-PINNED consumer of the livespec fleet's plugins:
// its `.claude/settings.json` marketplace entries name concrete release tags
// rather than the moving `release` branch ref that fleet members use. A
// concrete pin does not follow a release, so without a lane that advances it
// the pin silently goes stale — the plugin keeps resolving an older build
// forever.
//
// The released tag arrives as INPUT to THIS script, but that is a division of
// labor, not a limitation: resolving the tag belongs to the caller
// (`bump-plugin-pin.yml`), so this module stays a pure, testable rewrite.
//
// An earlier version of this comment claimed a "poll for the latest release"
// design "cannot work here", because a repository-scoped `GITHUB_TOKEN` cannot
// read a PRIVATE sibling's releases. That premise is FALSE and the lane now
// depends on it being false: `livespec-overseer` is a PUBLIC repository, its
// `releases/latest` is readable anonymously, and the workflow's scheduled pull
// resolves the tag with this repository's own token and no cross-repo
// credential at all. Do not restore the dispatch-only reading — the push hop
// from the producer is unauthorized by design (adopters bring their own App),
// so the pull is what makes the lane work.
//
// Two refusals are load-bearing, and both are pinned by tests:
//   - a `ref` that is NOT a concrete version is never rewritten. A `release`
//     ref auto-follows the channel by design; rewriting it would silently
//     convert a released posture into a pinned one.
//   - a TAG that is not a concrete version is never applied. A payload
//     carrying a branch name would otherwise pin this consumer to a moving ref
//     under the guise of a bump.
//
// The rewrite is textual on the single `ref` value so the rest of the file is
// preserved byte for byte. The committed file is kept in the shape the
// `claude plugin` CLI writes, and reserializing it here would dirty the tree
// on every provisioning run.
//
// Invocation:
//   bun scripts/bump-plugin-pin.ts --source-repo <name> --tag <vX.Y.Z>
// Exit status: 0 whether or not anything changed; 1 only on a usage error.
// `bumped=<true|false>` is written to $GITHUB_OUTPUT when that is set, so a
// workflow can decide whether to open a pull request.

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// A concrete version pin: `v` followed by a dotted numeric version. Anything
// else — `release`, `master`, a branch or a bare sha — is a moving ref.
const CONCRETE_VERSION = /^v\d+(?:\.\d+)*$/;

interface Change {
  marketplace: string;
  from: string;
  to: string;
}

export interface BumpResult {
  settingsText: string;
  changed: Change[];
  rejectedTag: boolean;
}

interface MarketplaceEntry {
  source?: { source?: unknown; repo?: unknown; ref?: unknown };
}

export function bumpPin({
  settingsText,
  sourceRepo,
  tag,
}: {
  settingsText: string;
  sourceRepo: string;
  tag: string;
}): BumpResult {
  if (!CONCRETE_VERSION.test(tag)) {
    return { settingsText, changed: [], rejectedTag: true };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(settingsText);
  } catch {
    return { settingsText, changed: [], rejectedTag: false };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { settingsText, changed: [], rejectedTag: false };
  }
  const marketplaces = (
    parsed as { extraKnownMarketplaces?: Record<string, MarketplaceEntry> }
  ).extraKnownMarketplaces;
  if (marketplaces === undefined) {
    return { settingsText, changed: [], rejectedTag: false };
  }
  const changed: Change[] = [];
  let text = settingsText;
  for (const [marketplace, entry] of Object.entries(marketplaces)) {
    const source = entry.source;
    const repo = source?.repo;
    const ref = source?.ref;
    if (typeof repo !== "string" || typeof ref !== "string") {
      continue;
    }
    // Match the repository by its full trailing name, so `livespec` cannot
    // match `livespec-overseer`.
    if (repo !== sourceRepo && !repo.endsWith(`/${sourceRepo}`)) {
      continue;
    }
    if (!CONCRETE_VERSION.test(ref) || ref === tag) {
      continue;
    }
    // Rewrite the ref for THIS entry only. The repo name is unique per entry,
    // so anchoring on it keeps the replacement from touching a sibling that
    // happens to share a ref value.
    const before = text;
    text = text.replace(
      new RegExp(
        `("repo"\\s*:\\s*"${repo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^}]*?"ref"\\s*:\\s*")${ref}(")`,
      ),
      `$1${tag}$2`,
    );
    if (text === before) {
      continue;
    }
    changed.push({ marketplace, from: ref, to: tag });
  }
  return { settingsText: text, changed, rejectedTag: false };
}

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

if (import.meta.main) {
  const sourceRepo = argValue("--source-repo");
  const tag = argValue("--tag");
  if (
    sourceRepo === undefined ||
    tag === undefined ||
    sourceRepo.length === 0 ||
    tag.length === 0
  ) {
    process.stderr.write(
      "usage: bump-plugin-pin.ts --source-repo <name> --tag <vX.Y.Z>\n",
    );
    process.exit(1);
  }
  const repoRoot = join(import.meta.dir, "..");
  const settingsPath = join(repoRoot, ".claude", "settings.json");
  const result = bumpPin({
    settingsText: readFileSync(settingsPath, "utf8"),
    sourceRepo,
    tag,
  });
  if (result.rejectedTag) {
    process.stdout.write(
      `refused: ${tag} is not a concrete version tag; nothing rewritten\n`,
    );
  }
  for (const change of result.changed) {
    process.stdout.write(
      `bumped ${change.marketplace}: ${change.from} -> ${change.to}\n`,
    );
  }
  if (result.changed.length > 0) {
    writeFileSync(settingsPath, result.settingsText);
  } else {
    process.stdout.write("no pin to advance\n");
  }
  const output = process.env.GITHUB_OUTPUT;
  if (output !== undefined && output.length > 0) {
    appendFileSync(output, `bumped=${String(result.changed.length > 0)}\n`);
  }
  process.exit(0);
}
