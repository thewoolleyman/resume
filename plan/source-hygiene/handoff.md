# Handoff — source-hygiene (comment discipline)

**Thread:** `plan/source-hygiene/` — **Driver-agnostic:** paste this
file's path into Claude Code or Codex. Goal: ratify and mechanically
enforce a `Comment discipline` policy that bans rotting
provenance-breadcrumb comments in committed source, purge the existing
ones, and archive the completed plan threads cleanly.

## Read first

1. `plan/source-hygiene/research/findings.md` — the design of record:
   the mirrored livespec policy (Rule 1 WHY-not-WHAT + Rule 2
   no-historical-bookkeeping), the extended banned set, scope/exemptions,
   the gate design, and the work slices.
2. `SPECIFICATION/non-functional-requirements.md` §"Constraints" — where
   the ratified `Comment discipline` section lives (or the pending
   `SPECIFICATION/proposed_changes/comment-discipline.md` before revise).
3. The livespec source policy this mirrors: livespec
   `SPECIFICATION/non-functional-requirements.md` §"Comment discipline"
   and `dev-tooling/checks/comment_no_historical_refs.py`.

## What this thread is

Product source (`src/**`) and `e2e/**` are already clean; the
check-harness scripts accumulated provenance breadcrumbs. This thread
ratifies the ban, enforces it with a standalone `bun run check` gate
(comment-only scan; string literals and exempt trees untouched), purges
the existing breadcrumbs, and then archives the `guardrail` and
`adversarial-spec-hardening` threads — which were previously referenced
mainly by those breadcrumbs — with no dangling paths left behind.

## Loop autonomously until blocked or complete

Drive the work-slice order in `findings.md` §"Work slices": propose →
revise → implement gate → purge → archive. Land each coherent unit to
`master` in a dedicated secondary worktree (worktree-mandatory per
`non-functional-requirements.md` §"Pull request landing automation"),
with `bun run check` green before landing. Do not ask for confirmation
to commit/land coherent work.

STOP only for a maintainer decision (a spec conflict, an
accept/reject judgment the maintainer must own, or anything
destructive/irreversible), plan completion, or session limits.

## Standing rules

- Author/commit ONLY in a secondary worktree; land via fast-forward
  push to `master` or PR auto-merge, then clean up.
- Preserve the standalone boundary: the gate is standalone
  TypeScript/Bun; no livespec fleet Python tooling.
- The gate scans comments/docstrings only; never break functional string
  literals or fixtures, and keep durable `SPECIFICATION §"…"` pointers.
- Use livespec propose-change/revise before relying on the policy.
- `bun run check` MUST be green before landing.
- Never address the maintainer with only an opaque id/token; describe the
  task and the files/behavior it affects, and end the report with the
  §"Resume" paste line plus the next ripe action.

## Where the loop stands now

**Status: COMPLETE (2026-07-10).** All five slices landed:

- **Ratified.** §"Comment discipline" (Rule 1 WHY-not-WHAT judgment-only;
  Rule 2 no-historical-bookkeeping-references mechanized) is in
  `non-functional-requirements.md` §"Constraints" with a scenario, cut and
  landed as **v031**.
- **Enforced.** `scripts/check-comments.ts` (+ `check-comments.test.ts`) is
  wired into `bun run check` as `[ok] comment discipline (no rotting
  references)` — a comment/docstring-only scan (string literals and exempt
  trees untouched) over `scripts/`, `src/`, `e2e/`, workflows, and config.
- **Purged.** All 74 breadcrumb comments removed from `scripts/**`,
  `.livespec.jsonc`, and one `src/**` test; the gate is green. Durable
  `SPECIFICATION §"…"` pointers kept; the ratified-example path in the NFR
  section and the gate test's sample string are intentionally retained (spec
  is exempt; the test string is fixture data, not a comment).
- **Archived cleanly.** `guardrail` and `adversarial-spec-hardening` moved to
  `plan/archive/` with all live pointers repointed; no dangling reference in
  the live tree. `worktree-guards` was already archived.

Nothing remains in this thread. It is ready to archive to
`plan/archive/source-hygiene/` on the maintainer's nod.

## Resume

This thread is COMPLETE — there is no further action here. The next ripe work
is the adjacent `plan/mvp/` thread (R2 visual redesign, maintainer-driven).
Paste this into Claude Code or Codex:

```text
plan/mvp/handoff.md
```
