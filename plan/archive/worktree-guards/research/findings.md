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

## What REMAINS

Nothing — the thread is COMPLETE (2026-07-10). The **primary-checkout
commit-refuse hook** is LANDED and ACTIVE, and the adjacent spec critique has been
processed (see §"Adjacent open item — RESOLVED").

## Landed — the commit-refuse hook (2026-07-10)

The hook refuses when the repository git-dir equals its git-common-dir (the
primary checkout) and allows in a secondary worktree (whose git-dir is
`.git/worktrees/<name>`). Delivered in a worktree, landed green:

1. **Test** — `scripts/check-primary-checkout.test.ts` exercises the pure
   `commitLocation()` topology (refuse in a primary checkout, allow in a secondary
   worktree, unknown outside git) and the ownership-scoped CLI (allow in a foreign
   fixture, refuse in a governed primary, allow in a governed worktree), following
   the `bun:test` + `Bun.spawnSync` idiom.
2. **Wired** `.githooks/pre-commit` — runs
   `bun "$hook_dir/../scripts/check-primary-checkout.ts"` before the
   `exec bun ".../check-memory.ts" --staged` memory guard.
3. **Verified in `check.ts`** — the `checkPrimaryCheckoutHook` gate asserts
   `.githooks/pre-commit` invokes `check-primary-checkout.ts`, so a
   bypassed/uninstalled hook fails `bun run check` (satisfies v028 "`bun run
   check` MUST verify the commit-refuse hook is installed and MUST fail when it is
   absent").

**Ownership scoping (design refinement).** Wiring the hook as-is would have
refused every `scripts/tdd-hook.test.ts` fixture commit: those fixtures are
`git init` primary checkouts that borrow this repo's committed hooks via
`core.hooksPath`. The fix keeps `commitLocation()` pure topology and adds a
`governsCheckout()` ownership gate in the CLI: it refuses ONLY when the commit's
git-common-dir is this hook script's own repository `.git` (resolved from
`import.meta.dir`). A fresh clone of THIS repo at any path is still governed and
refused; a foreign fixture is left alone. The two full-check fixture builders
(`check.test.ts`, `toolchain-gates.test.ts`) were updated to write a wired
`.githooks/pre-commit` so they pass the new gate. `bun run check` green.

## Adjacent open item — RESOLVED (2026-07-10)

- `claude-opus-4-8-critique` — the filed critique surfacing the
  `constraints.md §"Predecessor data migration boundary"` "verbatim snapshot"
  contradiction with the v027/v029 redaction + owner-authored-edit model — was
  **accepted via `/livespec:revise`, cutting and landing v030 (`5c5cc45`).**
  `constraints.md` now states the committed `data/resume.yml` snapshot MAY diverge
  via owner-directed PII redactions and owner-authored content edits, need NOT be
  byte-identical, and records the two-hash provenance (retrieved-source SHA-256 +
  committed-snapshot SHA-256) plus the per-edit ledger, cross-referencing spec.md
  §"Governed data source and predecessor import (phase 1)" rather than restating a
  stricter rule. The proposed-change + paired revision file are archived under
  `SPECIFICATION/history/v030/proposed_changes/`; `proposed_changes/` holds only
  `README.md`. Post-step doctor static + `bun run check` green. **This was the
  last item; the thread is now complete.**
