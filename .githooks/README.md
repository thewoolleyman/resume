# Committed git hooks

This directory is the repository's committed hook set, installed by
`bun run bootstrap` (which points `core.hooksPath` here via
`scripts/install-hooks.ts`), per
`SPECIFICATION/non-functional-requirements.md` §"Hooks" — hooks MUST be
reproducible from committed configuration.

Hook files land additively with their guardrail slices
(`plan/archive/guardrail/research/findings.md` §"Work slices"):

- `commit-msg` — the content-triggered Red -> Green TDD gate
  (work item `li-avk7d7`).
- `pre-commit` — two gates, each also re-run inside `bun run check` so
  a bypassed or uninstalled hook is still caught:
  - the primary-checkout **commit-refuse** gate
    (`scripts/check-primary-checkout.ts`), rejecting a commit authored
    in the primary checkout rather than a secondary git worktree and
    naming the `git worktree add` alternative (§"Pull request landing
    automation" / §"Hooks", worktree-mandatory since v028). The gate is
    scoped to this repository, so foreign repos that borrow these hooks
    via `core.hooksPath` (the `scripts/*.test.ts` fixtures) are not
    refused; `bun run check` verifies the wiring is present.
  - the local memory guardrail (`scripts/check-memory.ts --staged`)
    rejecting prohibited private-memory / hidden tool-state paths,
    unindexed `.ai/*.md` notes, and dangling `AGENTS.md` links in the
    staged tree (work item `li-6b6u6m`; policy in `AGENTS.md` §"Local
    memory guardrail policy"). `bun run check:memory` runs the same
    guard inside `bun run check`.

Because `bootstrap` installs the *directory*, hooks added later are
active for every clone that has already run `bootstrap` — no
re-installation step is needed.
