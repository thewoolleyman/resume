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

### Plan handoff discipline

Plans live under `plan/<name>/` with `research/findings.md` (the design
of record) and `handoff.md` (the paste-driven session entry point),
following the `plan/adversarial-spec-hardening/` convention:

- `handoff.md` tells a driver to do exactly ONE action per session and
  ends with a `## Resume` section holding the exact paste line.
- Non-derivable loop state lives in a "Where the loop stands now"
  section of `handoff.md`, updated by the turn that changes it. State
  derivable from the repo (e.g. the git-jsonl `next` ranking) is not
  duplicated there.
- Every session report MUST end with the next handoff prompt line —
  the exact text to paste into the next Claude Code or Codex session
  (normally the handoff path in a fenced code block) — paired with a
  human-readable description of the next ripe action.

### Functional vs. non-functional taxonomy

In this repo the split is **product vs. process**, NOT the textbook
behavior-vs-quality split. `non-functional-requirements.md` is the ONLY
non-functional file (how contributors build/test/maintain: toolchain,
TDD, CI, quality gates). Every other `SPECIFICATION/` file —
`spec.md`, `contracts.md`, `constraints.md`, `scenarios.md` — is
**functional**: it specifies the delivered product, including
runtime/deploy/framework/accessibility/performance constraints. So
framework choice, performance, and accessibility are functional here and
live in `constraints.md`, even though a textbook taxonomy would label
them "non-functional qualities."

The file named `non-functional-requirements.md` IS the authoritative
definition of the category; do not override it with the generic meaning
of the term. Derive a project's taxonomy from its own artifacts (file
names, boundary sections), not from training priors.
