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

Next ripe action: drive **slice 1 (`li-gn6`) — the SvelteKit + Vercel
toolchain scaffold** — on a NEW feature branch (not `master`; see the
product-build flow above). Stand up the SvelteKit app with the Vercel adapter
and prerendering, and replace the `dev`/`build`/`test:unit`/`test:integration`/
`test:e2e` stubs (`scripts/not-yet-provisioned.ts`) with real Vitest
(coverage via `vitest run --coverage` feeding `scripts/check-coverage.ts`) and
Playwright runners. This is the first `src/**` product source and flips the
armed gates to enforcing; keep `svelte-check` and the strict toolchain green.
Then continue through slices 2–10 on the branch, landing the complete green
phase-1 via PR.

## Resume

Paste this into Claude Code or Codex:

```text
plan/mvp/handoff.md
```
