# Handoff — worktree-mandatory enforcement (activate commit-refuse)

**Thread:** `plan/worktree-guards/` — **Driver-agnostic:** paste this file's path
into Claude Code or Codex. Goal: fully realize the **worktree-mandatory landing
policy** ratified in livespec **v028** by activating the held primary-checkout
commit-refuse hook, then process the one open spec critique.

## Read first

1. `plan/worktree-guards/research/findings.md` — what's landed (v028 policy +
   guards `aa23d95`), what remains (the held commit-refuse hook), and the exact
   4-step activation slice.
2. `SPECIFICATION/non-functional-requirements.md` §"Pull request landing
   automation" and §"Hooks" (v028) — the ratified policy and the commit-refuse /
   agent-guard requirements.
3. `scripts/check-primary-checkout.ts` header — the built-but-held hook and its
   activation recipe.

## Fresh-restart note

Drive this from a **fresh session / cloud restart**: during this work the
`livespec@livespec` plugin for `/data/projects/resume` was pinned to a STALE
build (`f906c7481cb4`) vs. the release build (`dd9ae4ce7219`); operations had to
run against the release build explicitly. A fresh restart reloads the pinned
build. The `session-plugin-freshness` SessionStart hook (landed `aa23d95`) now
warns if that drift recurs.

## What this thread is

livespec v028 made resume worktree-mandatory. The spec policy, the standalone
Claude Code agent-session guards, `.claude/CLAUDE.md` convention-load, and the
`AGENTS.md` "commit and land" rewrite are all LANDED (`aa23d95`). The one
remaining piece is the **primary-checkout commit-refuse hook** — built at
`scripts/check-primary-checkout.ts` but intentionally HELD (not wired into
`.githooks/pre-commit`, not required by `check.ts`) so it did not break
concurrent primary-checkout sessions during rollout. Activating it closes the
v028 §"Hooks" gap.

## Where the loop stands now

- **Concurrency cleared (2026-07-10):** the concurrent `resume` session is
  stopped; no other activity on `master`. The coast is clear to ACTIVATE the
  commit-refuse hook.
- **Held:** `scripts/check-primary-checkout.ts` is NOT in `.githooks/pre-commit`
  and NOT required by `check.ts`. It is currently UNTESTED — add a test before
  wiring (a false positive would refuse ALL commits).
- **Open critique:** `SPECIFICATION/proposed_changes/claude-opus-4-8-critique.md`
  (the `constraints.md` verbatim-snapshot contradiction) awaits `/livespec:revise`.
- Adjacent, not this thread: `plan/mvp/` R2-R4 (visual redesign, redeploy,
  review) and the v029 About redeploy remain the MVP thread's work.

## Ripe actions (in order)

1. **Activate the commit-refuse hook** — the 4-step slice in
   `research/findings.md` §"Work slice": add a test → wire `.githooks/pre-commit`
   → add the `check.ts` verification → `bun run check` green → land in a worktree.
   On completion, drop "HELD" from the worktree note in `plan/mvp/handoff.md`.
2. **Revise the open critique** — run `/livespec:revise` to process the
   `constraints.md` contradiction (align `constraints.md §"Predecessor data
   migration boundary"` with spec.md's redaction/owner-edit two-hash model; cut
   the next `vNNN`).

## Standing rules

- Work ONLY in a secondary worktree (`git worktree add -b <branch>
  "$HOME/.worktrees/resume/<branch>" master`); NEVER author commits in the primary
  checkout. Land via a worktree fast-forward push to `master`
  (`git -C <worktree> push origin HEAD:master`) or PR auto-merge, then clean up
  the worktree and branch and refresh the primary checkout's `master`.
- Preserve the standalone boundary: all hooks stay standalone TypeScript/Bun, no
  livespec fleet Python tooling.
- `bun run check` MUST be green before landing.
- Commit conventions per `AGENTS.md` (e.g. `chore(hooks): …`, `chore(spec): cut
  vNNN — …`). Do not ask for confirmation to commit/land coherent work.
- Never address the maintainer with only an opaque id/token; always describe the
  task and the files/behavior it affects, and end the report with the §"Resume"
  paste line plus the next ripe action.

## Resume

Paste this into Claude Code or Codex:

```text
plan/worktree-guards/handoff.md
```
