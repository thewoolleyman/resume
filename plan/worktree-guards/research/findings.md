# Worktree-mandatory enforcement — design of record

**Thread:** `plan/worktree-guards/`. Completes the enforcement of the
worktree-mandatory landing policy ratified in livespec **v028**, so no session
can author changes in — or leave stray state on — the shared primary checkout.

## Why this thread exists

A 2026-07-10 session ran a spec-side operation directly in the primary checkout
on `master` and left an uncommitted proposed-change file polluting the shared
working tree — behavior the prior "direct-to-master is the owner's standing
preference" policy explicitly permitted. The owner directed adopting the livespec
fleet's worktree-mandatory model, backed by committed enforcement so the
discipline does not depend on agent judgment. Root cause of the original miss:
the repo's `AGENTS.md` conventions (including "commit and land automatically")
were never loaded into agent context — there was no `.claude/CLAUDE.md` — and
there were no enforcement hooks.

## What "worktree-mandatory" means (v028)

Per `SPECIFICATION/non-functional-requirements.md` §"Pull request landing
automation" and §"Hooks" (cut in v028):

- Every change MUST be authored and committed in a dedicated secondary git
  worktree: `git worktree add -b <branch> "$HOME/.worktrees/resume/<branch>"
  master`. The primary checkout MUST NOT author or commit changes.
- Landing: PR auto-merge OR a worktree fast-forward push to `master`; both
  linear (no merge commits), both end with worktree + branch cleanup.
- Enforcement: a committed primary-checkout **commit-refuse** hook (verified by
  `bun run check`) + standalone Claude Code agent-session guards + a
  `.claude/CLAUDE.md` convention-load path.

## What has LANDED

- **v028** (`bc2d715`): the spec policy reversal in
  `non-functional-requirements.md`, plus the enforcement scenario.
- **Guards + convention-load** (`aa23d95`), all standalone TypeScript/Bun:
  - `.claude/CLAUDE.md → ../AGENTS.md` symlink — loads conventions into EVERY
    session (the root-cause fix).
  - `.claude/hooks/footgun-guard.ts` — blocks `--no-verify`, `core.bare=true`,
    Bash writes into the Claude memory store.
  - `.claude/hooks/background-gate-guard.ts` — denies backgrounding a gate /
    landing command.
  - `.claude/hooks/subagent-stop-guard.ts` — blocks a sub-agent turn-end while a
    worktree it created still holds uncommitted/unpushed work.
  - `.claude/hooks/session-plugin-freshness.ts` — SessionStart staleness warning.
  - `.claude/settings.json` wiring; `AGENTS.md` "commit and land" rewritten to
    the worktree flow; memory allowlist extended; `scripts/agent-hooks.test.ts`
    subprocess smoke tests. `bun run check` green.

## What REMAINS (the held gap)

The **primary-checkout commit-refuse hook** is BUILT but HELD:
`scripts/check-primary-checkout.ts` exists and its logic is correct (refuse when
the repository git-dir equals its git-common-dir — the primary checkout; allow in
a secondary worktree whose git-dir is `.git/worktrees/<name>`), but it is
intentionally NOT wired into `.githooks/pre-commit` and NOT required by
`check.ts`. It was held to avoid breaking concurrent sessions that were still
committing in the shared primary checkout during the rollout. This is a
deliberate, documented gap against v028 §"Hooks", recorded in the file header.

## Work slice — activate the commit-refuse hook

Do this in a secondary worktree; land green.

1. **Add a test FIRST** for `scripts/check-primary-checkout.ts` (currently
   UNTESTED — critical, since a false positive would refuse ALL commits and brick
   the repo). Assert `commitLocation()` returns `"allow"` in a secondary worktree
   and `"refuse"` in the primary checkout. Follow the `bun:test` + `Bun.spawnSync`
   idiom in `scripts/tdd-hook.test.ts` / `scripts/agent-hooks.test.ts`.
2. **Wire** `.githooks/pre-commit`: prepend
   `bun "$hook_dir/../scripts/check-primary-checkout.ts"` before the existing
   `exec bun ".../check-memory.ts" --staged`.
3. **Verify in `check.ts`**: add a gate asserting `.githooks/pre-commit` invokes
   `check-primary-checkout.ts`, so a bypassed/uninstalled hook fails
   `bun run check` (satisfies v028 "`bun run check` MUST verify the commit-refuse
   hook is installed and MUST fail when it is absent").
4. **Run `bun run check` green**, then land via the worktree fast-forward flow.
   The activation commit is authored in a worktree, so its own now-wired
   pre-commit sees `commitLocation() === "allow"` and proceeds.

Completion: commit-refuse active + check-verified → v028 §"Hooks" fully realized;
this thread's Terminal step (update `plan/mvp/handoff.md`'s worktree note to drop
"HELD") is done.

## Adjacent open item

- `SPECIFICATION/proposed_changes/claude-opus-4-8-critique.md` — a filed critique
  surfacing the `constraints.md §"Predecessor data migration boundary"` "verbatim
  snapshot" contradiction with the v027/v029 redaction + owner-authored-edit
  model. Process it with `/livespec:revise` (align constraints.md with spec.md;
  cut the next `vNNN`).
