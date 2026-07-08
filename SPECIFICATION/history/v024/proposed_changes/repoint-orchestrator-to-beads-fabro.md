---
topic: repoint-orchestrator-to-beads-fabro
author: claude-opus-4-8
created_at: 2026-07-08T09:06:07Z
---

## Proposal: Repoint the work-item orchestrator commitment from git-jsonl to beads-fabro

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/README.md

### Summary

The ratified spec currently commits the project to dogfood the git-jsonl work-item orchestrator (livespec-orchestrator-git-jsonl). git-jsonl lacks an operator surface for selecting and dispatching implementation work — it ships only the thin `next` and heavyweight `implement` fallbacks used manually during the spec-hardening and guardrail phases. This change repoints the orchestrator commitment to beads-fabro (livespec-orchestrator-beads-fabro), which is installed and functional in this environment and ships the richer operator loop (`orchestrate` / `next` / `implement` / `capture-*`, backed by a beads store) the phase-1 MVP needs. It updates the three orchestrator-commitment statements in non-functional-requirements.md (the §Livespec governance dogfood line, the §Discipline adoption inventory required baseline row name, and the §Livespec ecosystem tooling adoption enumeration entry) and the one-line restatement in SPECIFICATION/README.md, so the ratified spec head names beads-fabro consistently. It is a like-for-like tooling repoint: no product behavior, no scenario, and no clause about delivered app behavior changes.

### Motivation

Slice 1 of plan/orchestrator-migration/research/findings.md. The repository was seeded to dogfood git-jsonl, but git-jsonl is not functional enough to drive real live implementation. beads-fabro is installed, functional, and ships the operator loop the MVP requires. The orchestrator migration must land its spec commitment before the live config, work-item store, discipline gate, and documentation are cut over, so the ratified specification commits to beads-fabro (not git-jsonl) before implementation planning relies on it. The standalone boundary (constraints.md §Standalone boundary) is preserved: beads-fabro remains a development-time work-item tool, not a runtime, build, test, CI, or hook dependency, and constraints.md does not name git-jsonl so it needs no change.

### Proposed Changes

Four surgical text repoints in the ratified spec head; no structural, scenario, or clause changes.

1. non-functional-requirements.md §"Livespec governance" (the dogfood commitment). Change:
   OLD: "The project MUST dogfood the livespec Codex driver and the git-jsonl orchestrator."
   NEW: "The project MUST dogfood the livespec Codex driver and the beads-fabro orchestrator (`livespec-orchestrator-beads-fabro`)."
   The following sentence ("Work items SHOULD be tracked through the selected orchestrator once the repository is ready for implementation planning.") is unchanged.

2. non-functional-requirements.md §"Discipline adoption inventory" (required baseline-row enumeration). Change the final list item:
   OLD: "...Bun/Vitest/Playwright/Svelte/SvelteKit/Vercel toolchain discipline, and git-jsonl work-item workflow."
   NEW: "...Bun/Vitest/Playwright/Svelte/SvelteKit/Vercel toolchain discipline, and beads-fabro work-item workflow."

3. non-functional-requirements.md §"Livespec ecosystem tooling adoption" (the enumerated-practices sentence). Change the git-jsonl clause:
   OLD: "...the doctor static and LLM-driven checks; the git-jsonl work-item workflow and its `capture-*` / `implement` front-ends; the proposed-change and revision file discipline under `SPECIFICATION/`;..."
   NEW: "...the doctor static and LLM-driven checks; the beads-fabro work-item workflow and its `orchestrate` / `next` / `implement` / `capture-*` front-ends; the proposed-change and revision file discipline under `SPECIFICATION/`;..."

4. SPECIFICATION/README.md (the one-line orchestrator restatement in the layout summary). Change:
   OLD: "The project dogfoods the Codex driver and git-jsonl orchestrator while keeping the resume app standalone from the livespec fleet at runtime, in CI, and in deployment."
   NEW: "The project dogfoods the Codex driver and beads-fabro orchestrator while keeping the resume app standalone from the livespec fleet at runtime, in CI, and in deployment."

The discipline-inventory gate (scripts/check-discipline-inventory.ts), the .ai/discipline-adoption.md inventory row, the live config (.claude/settings.json, .livespec.jsonc), and the work-item store are brought into line in the migration plan's later slices (2-4); this proposal changes only the ratified spec-head commitment, and bun run check stays green because no gate parses this prose.
