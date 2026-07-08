# Research - orchestrator migration (git-jsonl -> beads-fabro)

Design of record for `plan/orchestrator-migration/`. This plan is inserted
**between** `plan/guardrail/` (complete) and `plan/mvp/` (not yet started). It
runs BEFORE any first-party product source lands, because the phase-1 MVP must
be driven by a work-item orchestrator that is actually functional for live
implementation.

The active handoff is `plan/orchestrator-migration/handoff.md`.

## Why this plan exists

The repository was seeded to dogfood the **git-jsonl** work-item orchestrator
(`livespec-orchestrator-git-jsonl`). In practice git-jsonl is not functional
enough to drive real live implementation: it has no operator surface for
selecting and dispatching work (no `needs-attention` / `drive` /
`orchestrate`), only the thin `next` + heavyweight `implement` fallback used
manually during the spec-hardening and guardrail phases.

`livespec-orchestrator-beads-fabro` IS installed and functional in this
environment (`bd` and `fabro` CLIs on PATH; the plugin is cached) and ships
the richer operator loop the MVP needs: `orchestrate plan` (list
operator-selectable spec- and impl-side actions) + `orchestrate run --action
<id>` (dispatch factory-safe impl work through Dispatcher/Fabro), plus the
`next` / `implement` / `capture-work-item` surfaces backed by a beads store.

This plan migrates the repository from git-jsonl to beads-fabro end to end —
spec commitment, live config, the work-item store, the discipline gate, and
every live reference — so the MVP plan starts on a fully installed, verified
orchestrator with no git-jsonl residue.

## Goal

Convert the work-item orchestrator from `livespec-orchestrator-git-jsonl` to
`livespec-orchestrator-beads-fabro`, such that:

- The ratified specification commits to beads-fabro (not git-jsonl).
- beads-fabro is enabled, configured, and PROVEN functional (its operator
  loop drives a work item end to end against a beads-backed store).
- The existing `work-items.jsonl` records are migrated into the beads store.
- No **live** git-jsonl reference remains anywhere in the working tree
  (config, spec head, gates, docs, and every plan thread), and the completed
  plan docs are updated to reflect beads-fabro too.
- `bun run check` stays green throughout.

Its terminal step hands off to `plan/mvp/` and archives this plan.

## Source of truth

This is a livespec-governed spec change plus implementation. Drive the spec,
do not re-specify it here.

- `SPECIFICATION/non-functional-requirements.md` - the orchestrator commitment
  lives here and MUST be revised via livespec propose-change/revise:
  - §"Livespec governance" (line ~15): "The project MUST dogfood the livespec
    Codex driver and the **git-jsonl** orchestrator" -> beads-fabro.
  - §"Discipline adoption inventory" (line ~31): the required baseline row
    "**git-jsonl work-item workflow**" -> the beads-fabro work-item workflow.
  - §"Livespec ecosystem tooling adoption" (line ~41): "the **git-jsonl**
    work-item workflow and its `capture-*` / `implement` front-ends" -> the
    beads-fabro equivalents (`orchestrate` / `next` / `implement` /
    `capture-*`).
- `SPECIFICATION/constraints.md` §"Standalone boundary" - confirm the
  standalone rules still hold: no runtime/build/test/CI/hook dependency on the
  orchestrator plugin; beads-fabro is a development-time work-item tool, not a
  product or check-time dependency. Revise only if it names git-jsonl.
- The livespec plugin surfaces:
  `livespec-orchestrator-beads-fabro` (target) and
  `livespec-orchestrator-git-jsonl` (retired) skill sets and the beads store
  layout (`.beads/`).
- `.livespec.jsonc`, `.claude/settings.json`, `AGENTS.md`,
  `scripts/check-discipline-inventory.ts` (+ test), `.ai/discipline-adoption.md`,
  `README.md`, `SPECIFICATION/README.md` - the live config, gate, and docs.

The SPECIFICATION/history/vNNN snapshots are IMMUTABLE and MUST NOT be edited;
the spec change lands as a new history version.

## Non-goals

- Do NOT implement any phase-1 product source under `src/**` in this plan;
  that is `plan/mvp/`. This plan only changes the orchestrator and its
  references.
- Do NOT weaken or bypass any guardrail gate to land the migration.
- Do NOT edit immutable `SPECIFICATION/history/**` snapshots.
- Do NOT lose the closed guardrail work-item audit trail; migrate it.
- Do NOT leave git-jsonl half-installed alongside beads-fabro: the cutover
  must be complete (config, store, spec, gate, docs), not dual-homed.

## Operator surface

This plan is itself driven through the orchestrator being migrated, so the
operator surface changes MID-PLAN:

- **Before the beads-fabro bootstrap slice**, the active orchestrator is still
  git-jsonl; use its `next` + `implement` (as in the guardrail phase).
- **After the bootstrap slice**, the active orchestrator is beads-fabro; use
  its operator loop: `orchestrate plan` to list selectable actions,
  `orchestrate run --action <id>` to dispatch one, with `next` / `implement` /
  `capture-work-item` as the thin/heavyweight surfaces, all backed by the
  beads store. Invoke as `/livespec-orchestrator-beads-fabro:<skill>`.

Every work item must carry a human-readable title and description; never refer
to work only by an opaque id. Sessions run the loop autonomously — pick,
execute, land, repeat — stopping only for a maintainer blocker, plan
completion, or session limits (see `plan/orchestrator-migration/handoff.md`).

An adversarial watcher runs alongside the driver:
`plan/orchestrator-migration/live-adversarial-review-prompt.md`.

## Work slices

Drive in this order. The order matters: revise the spec first (git-jsonl is
still active and can drive it), then cut the store and config over to
beads-fabro, then bring the gate/docs into line, then prove it, then hand off.

1. **Spec hardening - repoint the orchestrator commitment.** livespec
   propose-change then revise `SPECIFICATION/non-functional-requirements.md`:
   the dogfood commitment, the discipline-inventory baseline row name, and the
   ecosystem enumeration all move from git-jsonl to beads-fabro. Confirm
   `constraints.md` §"Standalone boundary" still holds (revise only if it
   names git-jsonl). Land a new SPECIFICATION history version. (Driven with
   git-jsonl still active.)
2. **Bootstrap beads-fabro + migrate the store.** Enable
   `livespec-orchestrator-beads-fabro` in `.claude/settings.json` and remove
   the git-jsonl enablement; stand up the beads store (`.beads/`); migrate
   ALL `work-items.jsonl` records (the closed guardrail items plus this plan's
   own items) into beads (a jsonl->beads import; the git-jsonl plugin's
   shipped `migrate-beads` only goes beads->jsonl, so use `bd import` or the
   beads-fabro migration path); repoint `.livespec.jsonc`
   `implementation.plugin` to `livespec-orchestrator-beads-fabro`; retire
   `work-items.jsonl` (archive it). **Memory-guardrail interaction:** `.beads/`
   is a hidden top-level path, so `scripts/check-memory.ts` default-denies it
   until it is documented — add `.beads/` (the beads work-item store) to the
   `check-memory` allowlist AND to `AGENTS.md` §"Local memory guardrail
   policy" as ordinary orchestrator data, or `check:memory` fails. Verify the
   beads-fabro `next` / `list-work-items` return the migrated records.
3. **Discipline-inventory gate + inventory.** `scripts/check-discipline-inventory.ts`
   hardcodes `BASELINE_DISCIPLINES` including `"git-jsonl work-item workflow"`;
   rename it to the beads-fabro workflow to match the revised spec, and update
   `scripts/check-discipline-inventory.test.ts`. Update the
   `.ai/discipline-adoption.md` row (disposition, enforcement, and a citation
   that exists - the `.beads/` store and/or a `bd` command). Keep `bun run
   check` green (harness Suite-Green).
4. **Purge remaining live git-jsonl references.** Update `AGENTS.md`,
   `README.md`, `SPECIFICATION/README.md`, `.ai/discipline-adoption.md`, and
   every plan thread's docs - `plan/mvp/**` (operator surface + preconditions),
   the completed `plan/guardrail/**` and `plan/adversarial-spec-hardening/**`
   (per the maintainer's live+completed-docs decision), and this plan's own
   docs - plus `archive/livespec-seed.md` if it is treated as live. Add a
   verification that no live git-jsonl reference remains, scoped to exclude the
   immutable `SPECIFICATION/history/**` and the archived work-items store (a
   documented grep check, or a small committed gate if warranted).
5. **Prove beads-fabro is functional.** `bun run check` green; the beads-fabro
   operator loop drives a trivial work item end to end (`orchestrate plan` ->
   `orchestrate run`, or `next` -> `implement` -> close with beads audit);
   `next` returns real ripe items; the discipline-inventory gate passes with
   the beads-fabro row; no other gate regressed.
6. **Terminal handoff + self-archive.** Update `plan/mvp/handoff.md` and
   findings to use the beads-fabro operator surface, hand off to `plan/mvp/`,
   and archive `plan/orchestrator-migration/` (move under `archive/` or mark
   complete in place, matching how the guardrail plan closed). Commit e.g.
   `docs(plan): complete orchestrator migration; hand off to mvp`.

## Completion criteria

This plan is complete when:

- The ratified specification commits to beads-fabro; a new SPECIFICATION
  history version records the change.
- `.claude/settings.json` enables beads-fabro (not git-jsonl); `.livespec.jsonc`
  `implementation.plugin` is `livespec-orchestrator-beads-fabro`.
- The beads store exists, holds the migrated work items, and is documented in
  the memory-guardrail allowlist so `check:memory` passes.
- `scripts/check-discipline-inventory.ts` requires the beads-fabro baseline row
  and the inventory + citations resolve.
- No live git-jsonl reference remains (outside immutable
  `SPECIFICATION/history/**` and the archived work-items store).
- beads-fabro's operator loop is proven to drive a work item end to end.
- `bun run check` passes with all guardrail gates green.
- `plan/mvp/` reflects beads-fabro and this plan is archived.

## Communication rule

Never talk to a human using only an opaque phase code, work-item id, action
id, version id, or command token. Always pair the token with a human-readable
description of the work and the files or behavior it affects.
