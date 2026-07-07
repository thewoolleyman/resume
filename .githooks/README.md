# Committed git hooks

This directory is the repository's committed hook set, installed by
`bun run bootstrap` (which points `core.hooksPath` here via
`scripts/install-hooks.ts`), per
`SPECIFICATION/non-functional-requirements.md` §"Hooks" — hooks MUST be
reproducible from committed configuration.

Hook files land additively with their guardrail slices
(`plan/guardrail/research/findings.md` §"Work slices"):

- `commit-msg` — the content-triggered Red -> Green TDD gate
  (work item `li-avk7d7`).
- `pre-commit` — the local memory guardrail rejecting prohibited
  private-memory / hidden tool-state paths, unindexed `.ai/*.md`
  notes, and dangling `AGENTS.md` links in the staged tree (work item
  `li-6b6u6m`; policy in `AGENTS.md` §"Local memory guardrail
  policy"). `bun run check:memory` runs the same guard inside
  `bun run check`, so a bypassed or uninstalled hook is still caught.

Because `bootstrap` installs the *directory*, hooks added later are
active for every clone that has already run `bootstrap` — no
re-installation step is needed.
