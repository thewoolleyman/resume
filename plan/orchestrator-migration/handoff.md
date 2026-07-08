# Handoff - orchestrator migration (git-jsonl -> beads-fabro)

**Thread:** `plan/orchestrator-migration/` - **Driver-agnostic:** paste this
file's path into either Claude Code or Codex. The goal is to migrate the
repository's work-item orchestrator from `livespec-orchestrator-git-jsonl` to
`livespec-orchestrator-beads-fabro`, end to end, BEFORE the phase-1 MVP is
implemented — so the MVP is driven by an orchestrator that is actually
functional for live implementation.

## Read first

1. `plan/orchestrator-migration/research/findings.md` - why this plan exists,
   goal, source-of-truth sections, work-slice order, and completion criteria.
2. `SPECIFICATION/non-functional-requirements.md` - the git-jsonl orchestrator
   commitment (dogfood line, discipline-inventory baseline row, and ecosystem
   enumeration) that MUST be revised to beads-fabro via livespec
   propose-change/revise.
3. `plan/orchestrator-migration/live-adversarial-review-prompt.md` - the
   adversarial watcher prompt for a second session to review every landed
   commit against this plan.

## What this thread is

This plan changes the orchestrator only. It is a livespec-governed **spec
change plus implementation**:

- Spec: repoint the NFR's git-jsonl commitments to beads-fabro (new
  SPECIFICATION history version).
- Implementation: enable + configure beads-fabro, stand up and populate its
  beads store by migrating the existing `work-items.jsonl` records, bring the
  discipline-inventory gate and every live reference into line, and PROVE the
  beads-fabro operator loop drives work end to end.

This plan does NOT implement phase-1 product source under `src/**` (that is
`plan/mvp/`). It does NOT edit immutable `SPECIFICATION/history/**` snapshots.

## Loop autonomously until blocked or complete

Drive work items in a continuous loop within the session — do NOT stop after
one action. The operator surface CHANGES mid-plan (see below). Each iteration:

1. Pick the ripe item: before the beads-fabro bootstrap slice, run the
   git-jsonl `next` skill; after it, use the beads-fabro operator loop —
   `orchestrate plan` to list selectable actions, or `next` to rank the next
   work item.
2. Execute it: git-jsonl `implement` before the cutover; after the cutover use
   beads-fabro `orchestrate run --action <id>` or `implement <id>` (Red ->
   Green, close with beads audit evidence).
3. Commit and push each coherent unit to `master` automatically, matching the
   repository's `AGENTS.md` convention, then continue to the next iteration.

If no orchestrator-migration work items exist, seed them from
`plan/orchestrator-migration/research/findings.md` §"Work slices" using the
active orchestrator's `capture-work-item` skill: small, dependency-ordered
items with human-readable titles.

STOP looping only when one of these holds:

- **Plan complete** - the migration meets `findings.md` §"Completion
  criteria"; perform the Terminal step.
- **Maintainer blocker** - a decision or intervention only the human
  maintainer can provide: multiple valid directions with no spec answer, a
  conflict with the spec or a ratified decision, a needed spec change that the
  maintainer must ratify, missing credentials/tooling, or anything destructive
  or irreversible. State the blocker in human-readable terms and what decision
  or action is needed.
- **Session limits** - the context or session is ending; land what is
  coherent, never a half-cut-over orchestrator (e.g. never leave the store
  migrated but the config still pointing at git-jsonl, or the spec revised but
  the gate still requiring the git-jsonl row).

When the loop pauses or stops, report in human-readable terms what was done
and which files, config, gates, or behavior it affects; update §"Where the
loop stands now" when the non-derivable state changed; and END the report with
the next handoff prompt line from §"Resume" plus a description of the next ripe
action (or the blocker awaiting the maintainer).

## Required ordering

Drive migration work in the order recorded in
`plan/orchestrator-migration/research/findings.md` §"Work slices":

1. Spec hardening - repoint the orchestrator commitment (propose-change ->
   revise; new history version). Driven with git-jsonl still active.
2. Bootstrap beads-fabro + migrate the store (enable plugin, stand up
   `.beads/`, import `work-items.jsonl` records, repoint `.livespec.jsonc`,
   retire the jsonl store, document `.beads/` in the memory-guardrail
   allowlist so `check:memory` passes). **After this the active orchestrator
   is beads-fabro.**
3. Discipline-inventory gate + inventory (rename the required baseline row to
   the beads-fabro workflow; update the gate test and `.ai/discipline-adoption.md`).
4. Purge remaining live git-jsonl references (AGENTS.md, README.md,
   SPECIFICATION/README.md, every plan thread incl. the completed guardrail and
   adversarial-spec-hardening docs and plan/mvp; add a no-git-jsonl
   verification scoped to exclude immutable history).
5. Prove beads-fabro is functional (bun run check green; the operator loop
   drives a work item end to end; next returns real items).
6. Terminal handoff to plan/mvp + self-archive this plan.

## Terminal step

When the migration meets `findings.md` §"Completion criteria":

1. Update `plan/mvp/handoff.md` and `plan/mvp/research/findings.md` to use the
   beads-fabro operator surface (orchestrate / next / implement / capture via
   the beads store) with no git-jsonl residue.
2. Hand off to `plan/mvp` - the searchable interactive resume plus static-text
   resume phase-1 implementation.
3. Archive `plan/orchestrator-migration/` (move under `archive/` or mark
   complete in place, matching how `plan/guardrail/` closed).
4. Commit and push with a conventional message such as
   `docs(plan): complete orchestrator migration; hand off to mvp`.

## Standing rules

- Always commit and land coherent work to `master`; do not ask for
  confirmation.
- Preserve the standalone boundary: beads-fabro is a development-time
  work-item tool, NOT a runtime, build, test, CI, or hook dependency; no
  product or check-time dependency on the orchestrator plugin or sibling
  livespec repositories.
- Do NOT edit immutable `SPECIFICATION/history/**` snapshots; the spec change
  lands as a new version.
- Do NOT lose the closed guardrail work-item audit trail; migrate it into
  beads.
- Use livespec propose-change/revise for the orchestrator spec change before
  relying on it; do not hand-edit the ratified spec head.
- NEVER talk to the maintainer using only an opaque phase code, work-item id,
  action id, version id, or command token. Always include a human-readable
  description of the task and the files, behavior, or config it affects.
- ALWAYS end the session report with the next handoff prompt line from
  §"Resume" plus a human-readable description of the next ripe action.

## Where the loop stands now

Only non-derivable state is recorded here; the current ripe work item is
derivable by running the active orchestrator's `next` skill.

Current state: **plan scaffold authored; migration not yet started**
(2026-07-08). `plan/guardrail/` is complete (all thirteen `bun run check`
gates green). The active orchestrator is still `livespec-orchestrator-git-jsonl`
(enabled in `.claude/settings.json`; `.livespec.jsonc`
`implementation.plugin = livespec-orchestrator-git-jsonl`;
`work-items.jsonl` is the store). `livespec-orchestrator-beads-fabro` is
installed and functional in this environment (`bd` + `fabro` on PATH; plugin
cached) but NOT yet enabled or configured. The orchestrator-migration work
items are seeded in the git-jsonl store (they will migrate into beads during
slice 2). Nothing about the orchestrator has been cut over yet.

Next ripe action: run the git-jsonl `next` skill and drive slice 1 — the
**spec hardening** that repoints the NFR's git-jsonl orchestrator commitments
(the dogfood line, the discipline-inventory baseline row, and the ecosystem
enumeration) to beads-fabro via livespec propose-change then revise, landing a
new SPECIFICATION history version. git-jsonl stays active through this slice;
the beads-fabro cutover is slice 2.

## Resume

Paste this into Claude Code or Codex:

```text
plan/orchestrator-migration/handoff.md
```
