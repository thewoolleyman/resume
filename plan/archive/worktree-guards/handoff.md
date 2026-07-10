# Handoff — worktree-mandatory enforcement (THREAD COMPLETE)

**Thread:** `plan/worktree-guards/` — **Driver-agnostic:** paste this file's path
into Claude Code or Codex. Goal: fully realize the **worktree-mandatory landing
policy** ratified in livespec **v028**. **Status (2026-07-10): COMPLETE.** The
primary-checkout commit-refuse hook is activated AND the sole remaining item —
the one open spec critique — has been processed via `/livespec:revise` (v030 cut
and landed). Nothing in this thread remains; the next ripe work is the adjacent
`plan/mvp/` thread (see §"Next thread" below).

## Read first

1. `plan/worktree-guards/research/findings.md` — what's landed (v028 policy +
   guards `aa23d95` + the now-active commit-refuse hook) and the adjacent open
   critique.
2. `SPECIFICATION/non-functional-requirements.md` §"Pull request landing
   automation" and §"Hooks" (v028) — the ratified policy and the commit-refuse /
   agent-guard requirements.
3. `scripts/check-primary-checkout.ts` header — the now-active, ownership-scoped
   commit-refuse hook.

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
`AGENTS.md` "commit and land" rewrite all LANDED (`aa23d95`). The
**primary-checkout commit-refuse hook** — the last held piece — is now LANDED and
ACTIVE (`scripts/check-primary-checkout.ts` wired into `.githooks/pre-commit`,
tested by `scripts/check-primary-checkout.test.ts`, and verified by the
`checkPrimaryCheckoutHook` gate in `bun run check`). The v028 §"Hooks" gap is
closed. The only remaining thread work is processing the open spec critique.

## Where the loop stands now

- **Commit-refuse hook ACTIVATED (2026-07-10):** wired + check-verified +
  green-landed. Enforcement is ownership-scoped so it refuses only in THIS
  repository's primary checkout; foreign repos borrowing the hooks via
  `core.hooksPath` (the `scripts/*.test.ts` fixtures) are allowed. `commitLocation`
  stays pure topology; the CLI adds the ownership gate. `bun run check` green.
- **Open critique PROCESSED (2026-07-10):** `claude-opus-4-8-critique` (the
  `constraints.md` verbatim-snapshot contradiction) was accepted via
  `/livespec:revise`, cutting and landing **v030** (`5c5cc45`). `constraints.md
  §"Predecessor data migration boundary"` now aligns with spec.md's
  redaction/owner-edit two-hash model and cross-references it instead of asserting
  a stricter byte-verbatim/single-hash rule. `SPECIFICATION/proposed_changes/` is
  empty (only `README.md`). Post-step doctor static + `bun run check` green.
- **Nothing remains in this thread.** All v028 §"Hooks" and §"Pull request
  landing automation" enforcement is landed and the sole adjacent open critique is
  resolved.

## Next thread

This thread is complete. The next ripe work is the adjacent — NOT this thread —
`plan/mvp/` R2-R4 (visual redesign, redeploy, review) and the v029 About
redeploy. Resume from `plan/mvp/handoff.md`.

## Done log

Done (2026-07-10): **Process the open critique → cut v030** — ran
`/livespec:revise` (release-build core `dd9ae4ce7219` to pass the currency gate
under the stale pin), accepted `claude-opus-4-8-critique`, aligned
`constraints.md §"Predecessor data migration boundary"` with spec.md's
two-hash/redaction/owner-edit model, cut `v030`, `bun run check` green, landed via
a worktree fast-forward (`5c5cc45`). Post-step `capture-impl-gaps` was skipped
(narrated, not silent): the delta is a wording alignment to an already-ratified,
already-implemented model — zero new spec→impl surface — and the orchestrator
front-end skill was not loaded under the stale pin. Re-run from a fresh session
only if belt-and-suspenders gap capture is wanted (it will be a no-op).

Done (2026-07-10): **Activate the commit-refuse hook** — added the test, wired
`.githooks/pre-commit`, added the `checkPrimaryCheckoutHook` verification gate,
`bun run check` green, landed via a worktree fast-forward. "HELD" dropped from
`plan/mvp/handoff.md`.

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

This thread is COMPLETE — there is no further action here. To pick up the next
ripe work (the adjacent `plan/mvp/` thread), paste this into Claude Code or Codex:

```text
plan/mvp/handoff.md
```
