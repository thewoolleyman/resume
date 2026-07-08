# Handoff - phase-1 MVP

**Thread:** `plan/mvp/` - **Driver-agnostic:** paste this file's path into
either Claude Code or Codex. The goal is to implement the phase-1 product —
the searchable/filterable interactive resume at `/` and the static-text
resume at `/static`, to predecessor parity — under the repository guardrail
discipline that `plan/guardrail/` provisioned and proved.

## Read first

1. `plan/mvp/research/findings.md` - goal, source-of-truth sections,
   non-goals, work-slice order, and completion criteria.
2. `SPECIFICATION/spec.md`, `contracts.md`, `constraints.md`, and
   `scenarios.md` - the authoritative phase-1 product requirements.
3. `SPECIFICATION/non-functional-requirements.md` - the guardrail discipline
   every commit runs under (already enforced by `bun run check` and the
   installed hooks).

## What this thread is

This plan implements phase 1 ONLY: the interactive and static resume
surfaces to predecessor parity, driving the ratified specification. It does
NOT implement AI-driven mode (`/ai` answering behavior) or the MCP server —
those are later-phase and non-load-bearing; `/ai` MAY be omitted or a
documented placeholder.

This is the first work to write first-party product source under `src/**`.
The first `src/**` merge activates the armed guardrail gates (coverage
measurement, Result/ROP AST checks, property/fuzz targets, scenario
test-identifier resolution), so every slice runs Red -> Green with the full
enforcement suite green from the commit that introduces it.

## Loop autonomously until blocked or complete

Drive work items in a continuous loop within the session — do NOT stop after
one action. Each iteration:

1. Pick the ripe item: run the livespec-orchestrator-beads-fabro
   `needs-attention` skill for cross-plan triage, or `next` to rank the next
   work item.
2. Execute it: run the livespec-orchestrator-beads-fabro `drive --action
   <action-id>` to dispatch a selected action, or `implement` for that one
   item (Red -> Green, close with merge evidence).
3. Commit and push each coherent unit to `master` automatically, matching the
   repository's `AGENTS.md` convention, then continue to the next iteration.

If no MVP work items exist yet, seed them from
`plan/mvp/research/findings.md` §"Work slices" using
livespec-orchestrator-beads-fabro `capture-work-item` (small,
dependency-ordered items with human-readable titles), or let
`capture-impl-gaps` surface spec->impl gaps to file (gap capture is now
active — the guardrail terminal step removed the
`post_step_skip_capture_impl_gaps` skip).

STOP looping only when one of these holds:

- **Plan complete** - phase 1 meets `findings.md` §"Completion criteria";
  perform the Terminal step.
- **Maintainer blocker** - a decision or intervention only the human
  maintainer can provide: multiple valid directions with no spec answer, a
  conflict with the spec or a ratified decision, a needed spec change
  (propose-change/revise), missing credentials/secrets (e.g. Vercel project
  linkage/deploy tokens), or anything destructive or irreversible. State the
  blocker in human-readable terms and what decision or action is needed.
- **Session limits** - the context or session is ending; land what is
  coherent, never a half-implemented surface or a red gate.

When the loop pauses or stops, report in human-readable terms what was done
and which files, surfaces, or scenarios it affects; update §"Where the loop
stands now" when the non-derivable state changed; and END the report with the
next handoff prompt line from §"Resume" plus a description of the next ripe
action (or the blocker awaiting the maintainer).

## Required ordering

Drive phase-1 work additively in the order recorded in
`plan/mvp/research/findings.md` §"Work slices":

1. SvelteKit + Vercel toolchain scaffold (first `src/**`; activates the armed
   gates and real Vitest/Playwright runners).
2. Governed data source (`data/resume.yml` production snapshot).
3. Load + transform with malformed-data rejection.
4. Deterministic derivations (slugs/identifiers, dates, DOM-free search
   projection) - the property/fuzz targets.
5. Interactive domain logic (search, skill-level filter, section sort,
   composition).
6. Interactive rendering (`/`).
7. Static rendering (`/static`).
8. Shared markdown rendering.
9. Browser metadata + manifest.
10. Scenario test authoring + parity verification.

Each slice: Red -> Green, Result/ROP where core exports return typed results,
100% line+branch coverage for the source it adds, property/fuzz for the named
targets, and the mapped scenario tests so `check:scenarios` resolves.

## Terminal step

When phase 1 meets `findings.md` §"Completion criteria" (all mapped scenario
tests present and green, `bun run check` green with all gates ACTIVE over
`src/**`, interactive + static parity, the Vercel-adapter build prerenders):

1. Verify the production build and preview behavior satisfy
   `constraints.md` §"Framework and deployment" and §"Performance and
   availability".
2. Report phase-1 completion and hand off to the maintainer for phase-2
   planning (AI-driven mode and the MCP server), which begins only when a
   future proposed change activates those later-phase surfaces.
3. Commit and push with a conventional message such as
   `docs(plan): complete phase-1 mvp`.

## Standing rules

- Always commit and land coherent work to `master`; do not ask for
  confirmation.
- Preserve the standalone boundary: no runtime, build, test, CI, or hook
  dependency on sibling livespec repositories or Python-only fleet tooling.
- Keep the first-party product-source boundary clear: `src/**` (and
  Playwright specs under `e2e/**`, Vitest `*.test.ts`) is product/test
  source; repository harness/tooling, specs, docs, governed data, CI, hooks,
  and config are not `src/**` product source for the TDD pairing/range gates.
- Do NOT introduce AI answering behavior or an MCP surface in this plan.
- Use livespec propose-change/revise before relying on a behavior change that
  is not already specified.
- NEVER talk to the maintainer using only an opaque phase code, work-item id,
  action id, version id, or command token. Always include a human-readable
  description of the task and the files, behavior, or surface it affects.
- ALWAYS end the session report with the next handoff prompt line from
  §"Resume" plus a human-readable description of the next ripe action.

## Where the loop stands now

Only non-derivable state is recorded here; the current ripe work item is
derivable by running the livespec-orchestrator-beads-fabro `next` skill
against the beads store.

Current state: **harness preconditions for product work landed; the ten
phase-1 MVP work items are seeded in the beads store (slice 1 is ready).**
The `plan/guardrail/` thread was already complete (all thirteen `bun run check`
gates operational and green; TDD + memory hooks live; CI and PR auto-merge
operational; `scenario-coverage.json` maps all 36 load-bearing scenarios by
class). This session landed three harness commits on `master` (all gates
green, CI green) as the sanctioned preconditions to writing `src/**`:

- A `test(harness):` fix to the orchestrator-migration gate's harness test —
  its "passes on the current repository tree" case read the ambient repo via
  `git grep`, which crashed under the Suite-Green commit leg's `.git`-less
  `checkout-index` tree and had silently blocked EVERY Suite-Green commit (now
  guarded with `test.skipIf`).
- `chore(harness): relax premature-product-source guard for product work
  (li-eg4w7j)` — removed the `checkNoPrematureProductSource` boundary veto;
  `src/**` is now permitted and governed by the additive fail-closed gates
  (discipline inventory, CI, scenario mapping, coverage, Result/ROP).
- `chore(harness): enforce Result/ROP in the selected src/lib core dirs` —
  resolved a blocking watcher note: the Result/ROP gate only enforced
  Result-returning core exports under `src/data|domain|search|grounding|
  mcp-contracts`, but phase-1 core logic lives under the SvelteKit `$lib`
  layout (`src/lib/{data,search,sort,markdown}` per scenario-coverage.json),
  so core logic there could have exported raw values and still reported
  "result/rop discipline: ok". Extended the gate's layer split symmetrically
  under `src/lib` (core + boundary + UI), with red coverage proving a planted
  `src/lib/data` non-Result export now fails.

The ten work items are `li-gn6` (slice 1) … `li-1eh` (slice 10) — a
blocks-chain in `findings.md` §"Work slices" order; slice 1 is the only ready
item. No first-party `src/**` product source exists yet, so the coverage,
Result/ROP, property/fuzz, and scenario-resolution gates remain armed and
activate on the first product-source commit.

**Product-build flow (load-bearing — read before touching `src/**`):** the
scenario gate (`scripts/check-scenarios.ts`) sets `armed = !src/** present`, so
the instant the first `src/**` file exists it requires ALL 36
`scenario-coverage.json` identifiers to resolve to executable, non-skipped
tests; the coverage gate then requires every `src/**` file (including
`.svelte`) at 100% line+branch, and the inventory/CI gates already require
their artifacts. So `bun run check` only returns fully green once the ENTIRE
phase-1 exists. `master` must stay green and branch protection requires the
`check` status, so the phase-1 product MUST be built on a feature branch and
merged via PR when `bun run check` is fully green — the first `src/**` merge is
a complete, green phase-1, not an incremental scaffold. Per-commit, the TDD
Red→Green legs enable incremental work (the Green leg runs only the recorded
anchor test, so commits land while the aggregate is still red on the branch);
the Suite-Green leg requires the whole provisioned suite green. The Result/ROP
layer split is now: core `src/lib/{data,domain,search,sort,markdown}` return
`Result<T,DomainError>`; boundary `src/lib/{server,adapters,api}` return
`Promise<Result<…>>` and are the only dirs allowed to catch-without-rethrow
(e.g. the build-time YAML read/parse adapter); UI `src/routes|components|
src/lib/components` unwrap Result. The predecessor data source is fetchable
(pinned SHA-256 in `spec.md`), so slice 2 is not a maintainer blocker; Vercel
deploy credentials are only needed for actual deployment, not for phase-1
completion (which needs the local adapter build to prerender).

The `plan/orchestrator-migration/` thread is also complete: the work-item
orchestrator is now `livespec-orchestrator-beads-fabro`, backed by the `resume`
beads/Dolt tenant on the shared dolt-server (all prior work items migrated with
their audit trail; the retired JSONL work-items store is archived). Drive
work through the beads-fabro operator loop — `drive` / `plan` / `needs-attention`
/ `next` / `implement` / `capture-work-item`, all backed by the beads store.

### Session update (phase-1 product source built on `feat/phase-1-mvp`)

A working session implemented most of phase-1 on the local branch
`feat/phase-1-mvp` (merge-base `faac997`). **All product source is currently
UNCOMMITTED in the working tree** (`data/resume.yml`, all `src/**`, and the
config/`mise.toml` changes) — a product-source commit can only land as one
all-green Suite-Green commit, and `bun run check` is not yet fully green (see
the gate status below).

Repository baseline (keep accurate — the next agent reviews/pushes docs against
it):

- **No first-party product source (`src/**`) or governed data
  (`data/resume.yml`) is committed on the branch.** The branch's committed
  history over `origin/master` is docs / spec / plugin-config ONLY — the
  phase-1 handoff updates, the two `SPECIFICATION/proposed_changes/` files, a
  `plan/mvp/live-adversarial-review-prompt.md` note, and a `.claude/settings.json`
  livespec-plugin-settings pin (which mirrors the same pin on `origin/master`,
  so it nets out of `origin/master..HEAD`). Because that committed range carries
  no `src/**` or governed data, the TDD range gate passes. (Commit counts/SHAs on
  the branch and `origin/master` churn with small docs/config commits and on
  rebase — identify commits by message/category, not count or hash.)
- **All phase-1 product, test, and toolchain-config work is UNCOMMITTED in the
  working tree**, to land later as one all-green Suite-Green commit: the governed
  snapshot `data/resume.yml`; all `src/**` (source, `.svelte`, tests, fixtures);
  the Playwright specs dir `e2e/**`; the harness/tooling edits (`scripts/check.ts`
  + `scripts/check.test.ts` build/e2e gates, `scripts/tsconfig.json`,
  `e2e/tsconfig.json`); and toolchain config (`package.json`, `bun.lock`,
  `tsconfig.json`, `svelte.config.js`, `vite.config.ts`, `playwright.config.ts`,
  `eslint.config.js`, `mise.toml`, `.prettierignore`, `static/`).
- **`origin/master` keeps advancing with small docs/config commits** (currently
  a livespec-plugin-settings pin); the branch's merge-base with it is `faac997`.
  **Rebase the branch onto `origin/master` before landing.**

**Done and green** (`bun run typecheck`, `lint`, `format:check`, `build` all
pass; `bunx vitest run` = 104 tests pass; all 14 core `src/lib/**/*.ts` modules
at 100% line/branch):

- **Slice 1 toolchain:** SvelteKit 2.69 + `@sveltejs/adapter-vercel` (fully
  prerendered), Vitest 4 + `@vitest/coverage-v8`, Playwright 1.61, `fast-check`,
  `marked`, `yaml` — all pinned exactly. Node is pinned to **22.22.0 via
  `mise.toml`** because SvelteKit's postbuild `analyse` step crashes on Node 26
  (`internal.js` ESM resolution). `dev`/`build`/`test:unit`/`test:e2e`/
  `test:coverage` are real runners. Per watcher review, `scripts/check.ts` now
  has real `production build (bun run build)` and `end-to-end (bun run test:e2e)`
  aggregate gates (fail-close on a stub in a provisioned tree), with focused
  `scripts/check.test.ts` coverage.
- **Slice 2 data:** `data/resume.yml` present in the working tree (uncommitted,
  like all product source) as the byte-identical predecessor production
  snapshot (pinned SHA-256 verified from the `---` marker; provenance comments
  prepended; `data/` is `.prettierignore`d so the hash is preserved).
- **Slices 3/4/8 core:** `src/lib/data/{transform,slugs,dates,resume,types}`,
  `src/lib/markdown/render`, `src/lib/search/projection`, `src/lib/{result,
  errors,skill-levels}` — Result/ROP throughout (infallible steps threaded via
  `map`/`andThen` to avoid dead branches), 100% covered, malformed-data
  rejection (incl. non-string date/level scalars per watcher), the six
  `property.config.json` fast-check targets (seed 4242), and the pinned
  inventory (18 keys / 16 sections / 74 items) + Pivotal-anchor + `validated`/
  `theleanstartup` worked example all verified against the real snapshot.
- **Slice 5 domain:** `src/lib/search/search`, `src/lib/domain/{filter,compose}`,
  `src/lib/sort/section-sort` — search → filter → sort composition, seven sorts
  with tie-breaks + missing-date semantics, invalid-sort fallback, invalid-level
  visibility.
- **Slices 6/7/9 UI:** `src/routes/{+layout,+page,static/+page}` + server loads
  (prerendered), `src/lib/components/{ResumeApp,SectionView,ItemRow,LevelBadge,
  StaticResume}.svelte`, `src/lib/{page,nav,view}.ts`. The app **builds,
  prerenders both `/` and `/static`, and hydrates** — verified via a real
  Playwright run that search filters live. Metadata (title, description,
  canonical, robots, viewport, manifest, 192/512 icons) present. Item + section
  hash anchors clear the sticky nav via `scroll-margin-top` (watcher fix).
- **11 non-browser scenario tests** authored at the exact `scenario-coverage.json`
  identifiers (import/inventory/load/identifiers/slugs/projection/section-sort/
  markdown) — all present and passing.

**`bun run check` gate status — three RED gates, of two distinct kinds.**
Green: package-script surface, toolchain baseline, typecheck/lint/format
runners, TDD range (empty), memory guardrail, Result/ROP, property, production
build, no-git-jsonl. Red:

- **RED — `check:scenarios` (plain implementation, NO decision needed).** The
  ~24 browser-observable Playwright specs mapped in `scenario-coverage.json`
  (`e2e/*.e2e.ts`, ~11 files) are **not authored yet (0 of 11)**, so their
  identifiers do not resolve to executable tests. The `end-to-end (bun run
  test:e2e)` gate is red for the same reason (no specs → Playwright finds no
  tests). This also transitively reddens the harness-tests gate, because
  `scripts/check.test.ts`'s "passes on the current repository tree" case runs
  the full aggregate. **Fix = author the specs** (the e2e pipeline is proven —
  build → preview → hydrate → live search verified in a real Playwright run).
  Per ratified decision 2, the former `skill-levels.e2e.ts` "invalid legacy
  level" case is NOT a Playwright spec — that scenario becomes a non-browser
  "invalid level rejected at load" test, so it drops out of the e2e set.
- **RED — `test:coverage` (needs MAINTAINER decision 1).** Two Svelte
  components fall below the 100% branch floor: **`SectionView.svelte` 75% (9/12
  branches)** and **`ResumeApp.svelte` ~93%**. The gap is entirely Svelte 5's
  compiler-generated reactive-*update* branches for keyed `{#each}` over the
  static constant lists `SORT_OPTIONS`/`SKILL_LEVELS` (`svelte/require-each-key`
  forces the keys; the lists never change in-place, so those reconciliation/
  update branches are unreachable by default). → **Resolved by ratified decision
  1**: cover them with injected/mocked inputs at the unit level (the earlier
  "coverage-only fake API" rejection was overruled). No waiver, no gate change.

**RATIFIED maintainer decisions (2026-07-09).** Both are recorded as livespec
proposed changes under `SPECIFICATION/proposed_changes/` (apply them with
`/livespec:revise` before the implementation relies on them):

1. **Injectable mocks/DI at the unit level are legitimate for full coverage —
   the earlier review rejection was WRONG.** Any mock/DI behavior may be used at
   the bottom of the test pyramid to reach the non-negotiable 100% floor,
   including injection seams whose non-default values are exercised only by
   tests, and including driving framework-compiler-generated branches (e.g.
   Svelte's reactive-update / keyed-`{#each}` branches). No coverage waiver and
   no gate weakening. Recorded in
   `SPECIFICATION/proposed_changes/injectable-mocks-unit-coverage.md` (targets
   `non-functional-requirements.md` §"Test coverage expectations"). → Implement:
   cover `ResumeApp.svelte` / `SectionView.svelte` branches via injected/mocked
   inputs (e.g. inject the sort-options / skill-levels collections, or mock the
   collaborators, so the update/each branches execute).
2. **Invalid governed data is NOT allowed — reject at load; migrate legacy.** A
   present item `level` that is not one of the five defined keys is malformed
   governed data and MUST be rejected at load (fail build/prerender), exactly
   like a missing group or nameless item; the "invalid legacy level stays
   visible / `unknown level`" runtime tolerance is REMOVED from `contracts.md`.
   Any legacy invalid data is fixed by a planned migration step, not tolerated.
   Recorded in `SPECIFICATION/proposed_changes/reject-invalid-skill-levels.md`
   (targets `spec.md`, `contracts.md`, `scenarios.md`: the "invalid legacy skill
   level stays visible" scenario becomes "Invalid skill level is rejected at
   load", **non-browser-exercisable**, mapped to the load/transform rejection
   test — mirroring "Invalid sort input"). → Implement: transform rejects
   invalid levels; drop the domain `isInvalidLevel` / `unknown level` handling
   and the "invalid stays visible" filter branch; remap the scenario in
   `scenario-coverage.json` + `check-scenarios.ts` `EXPECTED_CLASS`.

**Remaining implementation (drive these to full green):**

- `/livespec:revise` to ratify the two proposed changes into the spec head, then
  add a small **legacy-invalid-data migration step** work item (decision 2) —
  the pinned production snapshot has no invalid levels, so it is a documented
  no-op path today, but the reject-at-load + migration pipeline must exist.
- Apply decision 1 (mock/inject to close the two Svelte coverage gaps → green
  `test:coverage`) and decision 2 (reject invalid levels; re-map the scenario).
- Author the ~24 browser-observable Playwright specs mapped in
  `scenario-coverage.json` → green `check:scenarios` + the e2e gate (the e2e
  pipeline is proven).
- Wire CI (`.github/workflows/check.yml`) to Node 22 (setup-node@22 or mise) so
  the SvelteKit build runs there.
- Land the complete phase-1 as **one all-green Suite-Green commit** (`git add
  -A`; the full suite incl. real Playwright must pass) and merge via PR when
  `bun run check` is fully green with all gates ACTIVE.

Next ripe action: **`/livespec:revise`** to ratify
`injectable-mocks-unit-coverage.md` and `reject-invalid-skill-levels.md` into
the spec head; then an implementation session applies both decisions (mock/inject
to close the Svelte coverage gaps; reject invalid levels + re-map that scenario
non-browser), authors the remaining Playwright e2e specs, wires CI Node 22, and
lands the green phase-1 via PR from `feat/phase-1-mvp`.

## Resume

Paste this into Claude Code or Codex:

```text
plan/mvp/handoff.md
```
