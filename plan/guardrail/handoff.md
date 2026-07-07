# Handoff - guardrail harness

**Thread:** `plan/guardrail/` - **Driver-agnostic:** paste this file's path into
either Claude Code or Codex. The goal is to build the initial repository
guardrail harness before any first-party product source under `src/**` lands.

## Read first

1. `plan/guardrail/research/findings.md` - goal, source-of-truth sections,
   work-slice order, completion criteria, and operator surface.
2. `SPECIFICATION/non-functional-requirements.md` - authoritative guardrail
   requirements.
3. `plan/adversarial-spec-hardening/research/findings.md` only if you need the
   historical rationale for why this plan follows spec hardening.

## What this thread is

This plan provisions the initial guardrail harness:

- `bootstrap` and the required Bun script surface.
- `bun run check` as the aggregate non-mutating quality gate.
- Strict TypeScript, Svelte, lint, format, and build validation.
- The content-triggered Red -> Green commit-msg hook, branch-range validation,
  trailer grammar, anchor-test checksum verification, and `tdd-commit` helper.
- Local memory guardrails and `.ai/discipline-adoption.md`.
- GitHub CI, pull-request auto-merge workflow, and branch-protection/settings
  verification.
- Result/ROP, 100% line and branch coverage for first-party `src/**` product
  source, property/fuzz, and scenario-mapping gates.

This plan does NOT implement the resume product. It prepares the repo so the
product MVP can be implemented under the required discipline.

## Loop autonomously until blocked or complete

Drive work items in a continuous loop within the session — do NOT stop after
one action. Each iteration:

1. Pick the ripe item: run `needs-attention` when the operator surface exists;
   until then run the livespec-orchestrator-git-jsonl `next` skill.
2. Execute it: `drive --action <action-id>` when available; until then run
   livespec-orchestrator-git-jsonl `implement` for that one item
   (Red -> Green, close with merge evidence).
3. Commit and push each coherent unit to `master` automatically, matching the
   repository's `AGENTS.md` convention, then continue to the next iteration.

(If no guardrail work items exist — already done as of `b03c271` — seed them
from `plan/guardrail/research/findings.md` §"Work slices" using
livespec-orchestrator-git-jsonl `capture-work-item`: small, dependency-ordered
items with human-readable titles.)

STOP looping only when one of these holds:

- **Plan complete** — perform the Terminal step.
- **Maintainer blocker** — a decision or intervention only the human
  maintainer can provide: multiple valid directions with no spec answer, a
  conflict with the spec or a ratified decision, a needed spec change
  (propose-change/revise), missing credentials/secrets (e.g. GitHub App
  secrets, branch-protection admin, Vercel), or anything destructive or
  irreversible. State the blocker in human-readable terms and what decision or
  action is needed.
- **Session limits** — the context or session is ending; land what is
  coherent, never a half-provisioned gate.

When the loop pauses or stops, report in human-readable terms what was done
and which files, gates, or behavior it affects; update §"Where the loop stands
now" when the non-derivable state changed; and END the report with the next
handoff prompt line from §"Resume" plus a description of the next ripe action
(or the blocker awaiting the maintainer), e.g.:

> Next: implement `li-XXXXXX` — <title> (<what it provisions>). Paste this into
> Claude Code or Codex:
>
> ```text
> plan/guardrail/handoff.md
> ```

Do not start product implementation under `src/**` until this plan's completion
criteria are met.

## Required ordering

Drive guardrail work additively in the order recorded in
`plan/guardrail/research/findings.md`:

1. Repository bootstrap and package-script surface.
2. Aggregate check skeleton.
3. TypeScript, Svelte, lint, and format gates.
4. Content-triggered Red -> Green TDD gate.
5. Local memory guardrail and discipline inventory.
6. GitHub CI and pull-request automation.
7. Result/ROP enforcement gate.
8. Coverage and property gates.
9. Scenario coverage gate.
10. Green precondition for product work.
11. Terminal handoff to `plan/mvp/`.

## Terminal step

When the full guardrail harness is present, operational, and green:

1. Create `plan/mvp/research/findings.md` and `plan/mvp/handoff.md`.
2. Flip `.livespec.jsonc` `post_step_skip_capture_impl_gaps` back to `false` or
   remove that skip so product implementation gap capture is active.
3. Hand off to `plan/mvp` - searchable interactive resume plus static-text
   resume only; no AI mode and no MCP server.
4. Commit and push with a conventional message such as
   `docs(plan): complete guardrail handoff to mvp`.

## Standing rules

- Always commit and land coherent work to `master`; do not ask for confirmation.
- Preserve the standalone boundary: no runtime, build, test, CI, or hook
  dependency on sibling livespec repositories or Python-only fleet tooling.
- Keep the first-party product-source boundary clear: repository harness/tooling,
  specs, docs, governed data, CI, hooks, and config are not `src/**` product
  source for the TDD pairing/range gates.
- Use livespec propose-change/revise before relying on a behavior change that is
  not already specified.
- NEVER talk to the maintainer using only an opaque phase code, work-item id,
  action id, version id, or command token. Always include a human-readable
  description of the task and the files, behavior, or gate it affects.
- ALWAYS end the session report with the next handoff prompt line from
  §"Resume" plus a human-readable description of the next ripe action, so the
  maintainer can paste it directly into the next Claude Code or Codex session.

## Where the loop stands now

Only non-derivable state is recorded here; the current ripe work item is
derivable by running the livespec-orchestrator-git-jsonl `next` skill against
`work-items.jsonl`.

Current state: **slices 1–7 done — bootstrap, script surface, aggregate
check, toolchain gates, the Red -> Green TDD gate, the local memory
guardrail + discipline inventory, GitHub CI + pull-request automation,
and the Result/ROP enforcement gate provisioned** (2026-07-08). Work items
were seeded at `b03c271` (`li-ugymfg` through `li-gzmujc`, each depending
on its predecessor). Closed so far: `li-ugymfg` (bootstrap + script
surface, merge `a2cf94e`), `li-w6mvog` (aggregate check skeleton, merge
`e6f5206`), `li-3gtzzs` (watcher fix: anchored exact-pin dependency
predicate, merge `058fb07`), `li-tagohm` (TypeScript/Svelte/lint/format
gates, merge `b3b047f`), `li-mhwzqt` (watcher fix: effective ESLint rule
enablement via eslint --print-config, merge `a3959fc`), `li-avk7d7`
(content-triggered Red -> Green TDD commit-msg hook, `TDD-*` trailer
grammar with sha256 anchor checksums, origin/master..HEAD range validation
in `bun run check`, and the `tdd-commit` helper, merge `6969e4e` —
self-hosting: that commit carries its own `TDD-Suite-Green-*` trailers),
`li-6b6u6m` (local memory guardrail + discipline inventory, merge
`b651ed9`: `scripts/check-memory.ts` wired as `bun run check:memory` AND
as the bootstrap-installed `.githooks/pre-commit` hook, rejecting
prohibited hidden tool-state paths with default-deny for undocumented
hidden paths, unindexed `.ai/*.md` notes, and dangling `AGENTS.md` links;
`.ai/discipline-adoption.md` carries all twelve baseline rows, verified by
`scripts/check-discipline-inventory.ts` inside `bun run check`, including
citation-existence checks), and `li-6tntj5` (watcher fix for two
guardrail bypasses in `b651ed9`, merge `ff16156`: a note is indexed only
by a purpose-bearing entry under the AGENTS.md "Agent-facing notes index"
— prose mentions no longer count — and the `.idea` exception is narrowed
to shareable project configuration with `.idea/workspace.xml`-style local
state default-denied; both watcher repros re-verified blocked at HEAD).
The ordinary-tool-configuration policy in `AGENTS.md` documents the
`.claude/settings.json` and narrow shareable-`.idea` exceptions.
Slice 6 closed as `li-xjjeqo` (merge `cc7b20f`):
`.github/workflows/check.yml` runs `bun run check` on PRs to master and
pushes to master (first run 28901040870 passed all gates on the GitHub
runner), `.github/workflows/auto-enable-merge.yml` enables rebase
auto-merge for eligible owner PRs via a GitHub App token,
`.github/README.md` documents statuses/merge-methods/protection, and
`scripts/check-ci.ts` verifies it all inside `bun run check`
(`CHECK_LIVE_GITHUB=1` adds live `gh` verification). Live GitHub state
was configured and verified: rebase-only merges, auto-merge +
delete-branch-on-merge enabled, a no-bypass `linear-history` ruleset
(id 18639747) binding administrators, and classic protection requiring
the `check` status non-strict. Slice 7 closed as `li-oaxjqm` (merge
`3a21662`): `scripts/check-result.ts` wired as `bun run check:result` —
standalone TypeScript compiler-API AST checks over first-party `src/**`
(armed-but-vacuous until product source lands): Result-returning core
exports, AsyncResult boundary exports, no ignored Results, rethrow-only
catches outside approved adapters, no thrown DomainError, no raw Error
rendering in UI modules, and a standalone import-boundary scan; plus
effective-enablement verification of `no-floating-promises` and the
newly enabled `switch-exhaustiveness-check` ESLint rules. The
standalone-dependency-boundaries inventory row flipped to gate-enforced
via that import scan. `bun run check` now runs ten
operational gates. The commit-msg (TDD) and pre-commit (memory) hooks
are LIVE for every commit. The `needs-attention` / `drive` operator
surface does not exist yet — use the git-jsonl fallback (`next` then
`implement`). The loop is autonomous: sessions drive items continuously
and stop only for maintainer blockers, plan completion, or session
limits.

The former "outstanding maintainer action" (GitHub App + secrets) was
converted by maintainer directive (2026-07-08) into the agent-executable
work item `li-2o7eza`, ranked first (a6V). Chrome on this host is
logged in to GitHub; the local `gh` auth has repo admin. The task uses
the standard livespec 1Password env-wrapper pattern — study
`/data/projects/1password-env-wrapper/` (README.md, SPECIFICATION.md,
`create-1password-env-wrapper.sh`, rendered examples
`with-livespec-env.sh` / `with-openbrain-env.sh`) and the prior art in
`/data/projects/livespec/plan/archive/github-app-auth/` and
`/data/projects/livespec/plan/archive/credential-wrapper/` BEFORE
building anything. Credentials destined for the new `resume` 1Password
Environment are additionally dumped to a `.env` file under the system
`/tmp` for the maintainer to import (explicit maintainer instruction).
Verify pattern understanding first and file livespec
propose-change/revise if the spec must name the wrapper as the
documented secret-injection mechanism, then implement.

Next ripe action: implement `li-2o7eza` — "GitHub App credentials via
the 1Password env-wrapper pattern": create the automation GitHub App in
the logged-in Chrome (permissions: pull_requests write + contents
write; install on `thewoolleyman/resume`; generate a private key), set
the `APP_ID` / `APP_PRIVATE_KEY` repo secrets, provision a committed
`with-resume-env.sh` wrapper via the 1password-env-wrapper factory for
a new `resume` 1Password Environment, dump those credentials to a
`/tmp` `.env` file for import, make every secret-needing command
(e.g. `CHECK_LIVE_GITHUB=1`) documented/tested through the wrapper, and
prove auto-merge operational (test PR auto-merges on a green `check`).
After it: `li-m2trzv` — coverage (100% line/branch for `src/**`,
`test:coverage`) and reproducible fast-check property/fuzz gates
(`test:property`), armed additively per NFR §"Test coverage
expectations" and §"Fuzzing and property checks".

## Resume

Paste this into Claude Code or Codex:

```text
plan/guardrail/handoff.md
```
