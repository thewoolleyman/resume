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

Current state: **plan just created; no MVP work items seeded yet.** The
`plan/guardrail/` thread is complete — all thirteen `bun run check` gates are
operational and green, the commit-msg (TDD) and pre-commit (memory) hooks are
live, CI and PR auto-merge are operational, and `scenario-coverage.json` maps
all 36 load-bearing phase-1 scenarios by class (the mapped test identifiers
are armed and must be authored as this plan lands `src/**`). No first-party
`src/**` product source exists yet, so the coverage, Result/ROP,
property/fuzz, and scenario-resolution gates are armed-but-vacuous and
activate on the first product-source merge.

The `plan/orchestrator-migration/` thread is also complete: the work-item
orchestrator is now `livespec-orchestrator-beads-fabro`, backed by the `resume`
beads/Dolt tenant on the shared dolt-server (all prior work items migrated with
their audit trail; the retired JSONL work-items store is archived). Drive
work through the beads-fabro operator loop — `drive` / `plan` / `needs-attention`
/ `next` / `implement` / `capture-work-item`, all backed by the beads store.

Next ripe action: seed the phase-1 work items from `findings.md` §"Work
slices" (dependency-ordered), then drive slice 1 — the **SvelteKit + Vercel
toolchain scaffold**: stand up the SvelteKit app with the Vercel adapter and
prerendering and replace the `dev`/`build`/`test:unit`/`test:integration`/
`test:e2e` stubs with real Vitest and Playwright runners. This is the first
`src/**` product source and activates the armed gates.

## Resume

Paste this into Claude Code or Codex:

```text
plan/mvp/handoff.md
```
