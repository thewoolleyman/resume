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

Current state: **slices 1–8 done — bootstrap, script surface, aggregate
check, toolchain gates, the Red -> Green TDD gate, the local memory
guardrail + discipline inventory, GitHub CI + pull-request automation
(auto-merge NOW PROVEN OPERATIONAL via PR #2 — see below), the
Result/ROP enforcement gate, and the coverage + property/fuzz gates
provisioned** (2026-07-08). Work items
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
via that import scan. Watcher fix `li-y31rgl` (merges `72fc1e2` + `cb636bc`) closed the
Result-gate bypass class found in `3a21662`: a Result bound to a
variable is flagged as ignored unless the binding is meaningfully read
— pure discards (`void result`, a bare `result;` statement) do not
count as reads — with void/paren/await discard unwrapping on call
statements, and `containsThrow` stops at function/class boundaries so
a swallowing catch cannot pass by declaring a nested throwing
function; all three watcher repros re-verified rejected at HEAD.
Slice 8 closed as `li-m2trzv` (merge `15d9b21`): the coverage gate
`scripts/check-coverage.ts` (`bun run test:coverage`) enforces the
committed 100% line/branch threshold floor from `coverage.config.json`
(kept separate from the gate so lowering it is caught), a per-file 100%
floor over any `coverage/coverage-summary.json` report, and — after
watcher fix `li-cvp8rq` (merge `b766aa5`) — that present first-party
`src/**` product source is actually MEASURED (a report must exist and
cover every src file, so `test:coverage` cannot pass while measuring
nothing once the product-source boundary relaxes); the property/fuzz
reproducibility gate `scripts/check-property.ts` (`bun run test:property`)
verifies the committed `property.config.json` metadata — fast-check
runner, fixed/logged seed, fast/CI run counts, replay command,
shrunk-counterexample capture, the five generator classes, and (also via
`li-cvp8rq`) that `phase1Targets` enumerates every spec-named phase-1
target. Both gates are armed-but-vacuous until product source lands. The
"fuzzing and property checks" discipline-inventory row flipped to
adopted/gate-enforced. `bun run check` now runs twelve
operational gates. The commit-msg (TDD) and pre-commit (memory) hooks
are LIVE for every commit. The `needs-attention` / `drive` operator
surface does not exist yet — use the git-jsonl fallback (`next` then
`implement`). The loop is autonomous: sessions drive items continuously
and stop only for maintainer blockers, plan completion, or session
limits.

`li-2o7eza` (GitHub App credentials via the 1Password env-wrapper
pattern, maintainer-directed) is DONE (2026-07-08, wrapper render merge
`06ca377`; closure `8e32fc9`). Landed: spec **v023** adds NFR §"Local
secret injection" naming the committed `with-resume-env.sh` wrapper as
the documented local secret-injection mechanism (proposal
`local-secret-injection-wrapper`, cut at `bd7733c`; the `.livespec.jsonc`
trailing comma that broke strict-JSONC doctor parsing was fixed at
`c71f65c`, and `.livespec.jsonc` is Prettier-ignored since its grammar
forbids Prettier's trailing commas). The GitHub App **resume-pr-bot**
(app id 4243167) was created via the logged-in Chrome (permissions:
contents write + pull_requests write; webhook off; installed ONLY on
`thewoolleyman/resume`, installation 145115216) and the
`APP_ID`/`APP_PRIVATE_KEY` repo secrets are set. **Pull-request landing
automation is PROVEN OPERATIONAL:** PR #2 was armed by
`app/resume-pr-bot` seconds after opening and rebase-merged
automatically on a green `check` (merge `1804aa4`, branch
auto-deleted); `bun scripts/check-ci.ts --live` passes. check-ci now
gates the wrapper contract (docs in `.github/README.md` +
`scripts/README.md` must document wrapper usage; an absent wrapper
REQUIRES the documented "render pending maintainer 1Password bootstrap"
state; a committed wrapper must be the untouched factory artifact for
IDENTIFIER='resume' with no secret values and no stale pending marker
— all red-covered, landed `1804aa4` + watcher follow-up `2e2bfcf`,
which also records the operational proof in the discipline-inventory
GitHub CI row). `.playwright-mcp/` browser artifacts are git- and
Prettier-ignored so local browser sessions cannot break `format:check`.

How it was rendered (2026-07-08): the maintainer logged the agent into
1Password in the Chrome session; the agent created the `resume`
Environment's **read-only service account** and the `resume` Linux
group, ran the factory (`IDENTIFIER=resume`,
`sudo -E ./create-1password-env-wrapper.sh`), and committed the rendered
`with-resume-env.sh` at the repo root. Installed at
`/usr/local/bin/with-resume-env.sh` (root:resume 0750); the SA token
lives in host systemd-creds
(`/etc/credstore.encrypted/1password-env-wrapper-resume`); bootstrap
`RESUME_1PASSWORD_*` vars are in the factory's gitignored `.env.local`.
Env id `fj6btfanxkhmqdrvrtjp2tj5qm`.

**KEY FINDING — `op run` flattens multiline secrets.** The wrapper's
`op run --environment` injects `GITHUB_APP_PRIVATE_KEY` FLATTENED to a
single line (0 newlines; `-----BEGIN…-----` jammed against the base64
body) regardless of how the key is stored in the Environment — the
livespec malformed-key failure mode. `openssl` rejects the raw value.
Fix: `scripts/normalize-pem.ts` (`normalizePem`), the standalone TS
realization of livespec's `normalize_pem`, reconstructs the PEM on read
(an openssl round-trip test proves raw-rejected / normalized-loads).
Any local consumer of a wrapper-injected key MUST normalize first —
documented in `.github/README.md`/`scripts/README.md`/`AGENTS.md`. No
repository command consumes the injected App key yet (the live GitHub
check uses `gh`); GitHub Actions is unaffected (it reads the
`APP_PRIVATE_KEY` Actions secret via `actions/create-github-app-token`,
which normalizes internally). `.playwright-mcp/` browser artifacts are
git- and Prettier-ignored so local browser sessions cannot break
`format:check`.

Next ripe action: `li-hb77ad` — the scenario coverage gate
(`check:scenarios`, slice 9), now `next`'s top-ranked ready item (the
`li-2o7eza` maintainer blocker is cleared). Per NFR §"Top-of-pyramid
discipline" and the scenario "Scenario coverage gate protects acceptance
behavior": add the committed scenario-to-test mapping data for every
load-bearing scenario in `SPECIFICATION/scenarios.md` and a
`check:scenarios` gate wired into `bun run check`, classifying each
scenario as browser-observable (a Playwright identifier) or
non-browser-exercisable (a named non-Playwright category plus
rationale), and failing on a missing, stale, mis-typed, or class-dodging
mapping. Armed additively like the other gates until product
scenarios/tests land.

## Resume

Paste this into Claude Code or Codex:

```text
plan/guardrail/handoff.md
```
