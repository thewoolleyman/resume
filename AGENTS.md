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

- `handoff.md` defines the driving procedure: one well-scoped action per
  iteration, looping autonomously until a blocker needs a human maintainer
  decision or intervention, the plan completes, or session limits are hit —
  unless the plan itself requires stricter turn-taking (e.g. adversarial
  critique/revise threads). It ends with a `## Resume` section holding the
  exact paste line.
- Non-derivable loop state lives in a "Where the loop stands now"
  section of `handoff.md`, updated by the turn that changes it. State
  derivable from the repo (e.g. the git-jsonl `next` ranking) is not
  duplicated there.
- Every session report MUST end with the next handoff prompt line —
  the exact text to paste into the next Claude Code or Codex session
  (normally the handoff path in a fenced code block) — paired with a
  human-readable description of the next ripe action.

### Local secret injection

Per `SPECIFICATION/non-functional-requirements.md` §"Local secret
injection": repository-local commands that need secrets (live GitHub
verification via `CHECK_LIVE_GITHUB=1`, future Vercel/AI keys) run
through the `with-resume-env.sh` wrapper (not committed yet — see
`.github/README.md` §"Local secret injection" for the pending
maintainer bootstrap), which injects the
`resume` 1Password Environment via `op run`. No secret value on a
command line or in a committed file; the wrapper is a generated
artifact of the external 1password-env-wrapper factory — never
hand-edit it. GitHub Actions uses the `APP_ID`/`APP_PRIVATE_KEY`
repository secrets instead (see `.github/README.md`). The default
`bun run check` requires no secrets.

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

## Local memory guardrail policy

Per `SPECIFICATION/non-functional-requirements.md` §"Local memory
guardrails": private local memories must never enter commits. The
prohibited committed set is `.claude/**`, `.codex/**`, `.cursor/**`,
`.continue/**`, `.aider*`, hidden memory databases, chat/prompt
transcripts, and tool cache directories — mechanically realized as
default-deny for every hidden (dot-prefixed) path outside the
allowlist below. Enforced twice: the bootstrap-installed
`.githooks/pre-commit` hook blocks offending commits, and
`bun run check:memory` (run by `bun run check`) catches a bypassed or
uninstalled hook. Both run `scripts/check-memory.ts`, whose allowlist
mirrors this policy; keep the two in sync.

Documented **ordinary tool configuration** (narrower-path exceptions,
configuration rather than memory):

- `.claude/settings.json` — Claude Code project settings (plugin
  marketplaces and enablement). Reproducible configuration only; the
  rest of `.claude/**` (memory, transcripts, caches) stays prohibited.
- Shareable JetBrains project configuration ONLY: `.idea/.gitignore`,
  `.idea/modules.xml`, `.idea/vcs.xml`, `.idea/GitLink.xml`,
  `.idea/misc.xml`, `.idea/encodings.xml`, top-level `.idea/*.iml`,
  and the `inspectionProfiles/`, `codeStyles/`, `runConfigurations/`
  subdirectories. Workspace/local state (`.idea/workspace.xml`,
  `shelf/`, `tasks.xml`, usage statistics, …) stays prohibited.
- `.ai/` (the sanctioned notes directory), `.githooks/`, `.github/`,
  `.livespec.jsonc`, `.prettierrc.json`, `.prettierignore`, and the
  `.gitignore`/`.gitattributes`/`.gitkeep`/`.editorconfig` basenames —
  ordinary repository configuration.

Agent-facing local notes live under `.ai/*.md` (flat, markdown only)
and every note MUST have a list entry stating its purpose under
§"Agent-facing notes index" below — a prose mention elsewhere in this
file does NOT count as indexing. A dangling reference to a missing
note also fails the guard.

## Agent-facing notes index (.ai/)

- `.ai/discipline-adoption.md` — the discipline-adoption inventory
  required by `SPECIFICATION/non-functional-requirements.md`
  §"Discipline adoption inventory": classifies every seed-listed
  fleet discipline (disposition, enforcement class, local artifact);
  shape and citations are verified by the discipline-inventory gate
  in `bun run check`.
