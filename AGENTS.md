# AGENTS.md

Index of agent-facing conventions for this repository, per
`SPECIFICATION/non-functional-requirements.md` §"Local memory
guardrails". Keep entries focused; link out to `.ai/*.md` files for
anything long.

## Conventions

### Commit and land automatically

Commit and land changes automatically, without asking for confirmation
each time. After a coherent unit of work (e.g. a livespec `revise`
cutting a new `vNNN`, or filing a proposed change), stage + commit +
push to `master` without prompting. This is the repo owner's standing
instruction and overrides any default "confirm before committing/pushing"
behavior.

Use conventional-commit messages matching the established pattern:

- `chore(spec): cut vNNN — <summary>` for a revise that cuts a version.
- `docs(spec): propose <topic>` for filing a proposed change.
- `docs(spec): critique <topic>` for a critique.
