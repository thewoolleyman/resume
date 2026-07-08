# Research - phase-1 MVP (searchable interactive + static resume)

Design of record for `plan/mvp/`. This plan begins after `plan/guardrail/`
provisioned and proved the repository guardrail harness (all thirteen
`bun run check` gates operational and green; the content-triggered
Red -> Green commit-msg hook and the local-memory pre-commit hook live for
every commit).

The active handoff is `plan/mvp/handoff.md`.

## Goal

Implement the **phase-1** product: the searchable/filterable interactive
resume at `/` and the traditional static-text resume at `/static`, to
predecessor parity, entirely under the guardrail discipline. Phase-1
completion is defined by the interactive and static contracts, constraints,
and scenarios in `SPECIFICATION/` — NOT by any AI route, AI answering
behavior, or MCP surface.

This plan writes first-party product source under `src/**` for the first
time. The first `src/**` merge activates the armed gates (coverage
measurement, Result/ROP AST checks, property/fuzz targets, and scenario
test-identifier resolution), so every slice runs Red -> Green with the full
enforcement suite green from the commit that introduces it.

## Source of truth

The authoritative requirements are the ratified specification. Do not
re-specify here; drive the spec:

- `SPECIFICATION/spec.md` - product intent, §"Delivery phases" (the phase
  boundary is load-bearing), §"Resume data" and §"Governed data source and
  predecessor import (phase 1)" (single canonical `data/resume.yml`,
  authoring shape, committed production snapshot with pinned provenance, and
  the pinned production scope: 18 top-level keys, 16 sections in order, 74
  items), §"Stable item identifiers" and §"Stable section identifiers" (the
  pinned slug/collision algorithm), and §"Predecessor data model parity".
- `SPECIFICATION/contracts.md` - §"Web routes" (`/` phase 1, `/static`
  phase 1, `/ai` later-phase omit/placeholder), the resume data contract and
  §"Governed data source contract" (authoring shape -> derived contract shape
  transform, malformed-data rejection), §"Interactive rendering contract"
  (build-time load, prerendered shell/success/failure states),
  §"Item rendering" (markdown, trusted raw HTML, dates), §"Search",
  §"Layout and controls" (Contents, Skill Levels, sort, collapse, Reset,
  legacy `#list-<ordinal>` aliases), and §"Error payloads".
- `SPECIFICATION/constraints.md` - §"Framework and deployment" (SvelteKit +
  Vercel adapter, prerender), §"Performance and availability", and the
  standalone boundary.
- `SPECIFICATION/scenarios.md` - the 36 load-bearing phase-1 scenarios. Each
  is already classified and mapped in `scenario-coverage.json`
  (browser-observable -> a Playwright identifier; non-browser-exercisable ->
  a named non-Playwright category identifier + rationale); this plan AUTHORS
  the mapped tests so `check:scenarios` resolution passes once `src/**` lands.
- `SPECIFICATION/non-functional-requirements.md` - the guardrail discipline
  every commit runs under (TDD Red -> Green, strict TS/Svelte/lint/format,
  Result/ROP, 100% line+branch coverage for `src/**`, reproducible
  property/fuzz, scenario coverage, CI + PR automation).

## Non-goals

- Do NOT implement AI-driven mode (`/ai` answering behavior), the AI chat
  contract, or the MCP server. They are later-phase and non-load-bearing;
  `/ai` MAY be omitted or a documented placeholder.
- Do NOT invent a skills taxonomy, cross-item relationships, or rich
  metadata beyond simple provenance; the optional forward-looking collections
  MUST default to empty (`spec.md` §"Resume data").
- Do NOT split resume facts across multiple sources; `data/resume.yml` is the
  single canonical governed source.
- Do NOT regress the interactive or static surfaces to stand up AI/MCP
  scaffolding.
- Do NOT weaken any guardrail gate to land product source; the gates are
  additive and non-negotiable.

## Operator surface

Driveable in either Claude Code or Codex. Preferred loop, once the
`needs-attention` / `drive` operator surface exists: `needs-attention` ->
`drive --action <id>` -> commit/push. Current fallback while the git-jsonl
surface matures:

- livespec-orchestrator-git-jsonl `next` to rank the next work item.
- livespec-orchestrator-git-jsonl `implement` to drive exactly one item
  Red -> Green, closing with merge evidence.
- If no MVP work items exist yet, seed them from the work slices below with
  `capture-work-item` (small, dependency-ordered, human-readable titles).

Sessions run this loop autonomously and stop only for a maintainer blocker,
plan completion, or session limits (see `plan/mvp/handoff.md`).

Gap capture is now ACTIVE (the guardrail terminal step removed the
`post_step_skip_capture_impl_gaps` skip in `.livespec.jsonc`), so
`capture-impl-gaps` / `capture-spec-drift` may surface spec->impl gaps to
file as work items.

## Guardrail preconditions (met at guardrail completion)

- `bun run check` runs thirteen operational gates and passes green.
- Bootstrap-installed commit-msg (TDD) and pre-commit (memory) hooks are live.
- CI (`check.yml`) and PR auto-merge (`auto-enable-merge.yml`) are operational
  (auto-merge proven via PR #2; App `resume-pr-bot` installed).
- The coverage, Result/ROP, property/fuzz, and scenario-resolution gates are
  armed and activate on the first `src/**` product source.
- `scenario-coverage.json` maps all 36 load-bearing scenarios by class.

## Work slices

Seed or drive in this order. The order is dependency-driven: data before
derivations before rendering, and the toolchain scaffold first because it
flips the interim runners to real Vitest/Playwright and activates the armed
gates.

1. **SvelteKit + Vercel toolchain scaffold.** Stand up the SvelteKit app
   with the Vercel adapter and prerendering; replace the `dev`, `build`,
   `test:unit`, `test:integration`, `test:e2e` stubs with real Vitest and
   Playwright runners (and coverage via `vitest run --coverage` feeding
   `scripts/check-coverage.ts`). This is the first `src/**` product source;
   from here the armed gates are live. Keep `svelte-check` and the strict
   toolchain green.
2. **Governed data source.** Commit `data/resume.yml` as the verbatim
   production snapshot in the authoring shape with the pinned provenance
   comments (source URL, retrieved date, upstream `Last-Modified`,
   SHA-256) and the pinned production scope (18 keys, 16 ordered sections,
   74 items, only the five real skill levels).
3. **Load + transform (Result/ROP).** Transform the authoring shape into the
   resume data contract; reject malformed data (missing `about`/`header`, a
   nameless item) at build/prerender under the phase-1 build-time load;
   tolerate the deferred optional collections as empty. Round-trip the pinned
   inventory.
4. **Deterministic derivations (property/fuzz targets).** The pinned
   item/section slug + `-2`/`-3` collision algorithm; ISO-8601/UTC date
   parse, `M.YYYY`/`until`/`current` render, and sort keys; the DOM-free
   markdown/HTML-stripped search projection.
5. **Interactive domain logic.** Case-insensitive substring search over
   name + stripped description; skill-level filtering (all-selected default,
   `unspecified` and invalid-level handling); the seven section sorts with
   name tie-breakers and missing-start/missing-end semantics;
   search->filter->sort composition order; invalid-sort-input guard.
6. **Interactive rendering (`/`).** Prerendered shell (sticky nav + centered
   header, no blank page), sections/items in governed order, About and
   Instructions controls, responsive nav collapse, deep-link to stable item
   anchors, missing-anchor no-op, sticky-nav offset reveal, legacy
   `#list-<ordinal>` alias/redirect, collapse/expand, Reset.
7. **Static rendering (`/static`).** All governed data, canonical order,
   fully expanded, no JS-only disclosure, crawlable/printable.
8. **Shared markdown rendering.** One renderer + config for both modes,
   byte-identical output, trusted raw HTML preserved (phase-1 posture),
   inline code spans, bare-URL links with trailing punctuation outside the
   link.
9. **Browser metadata + manifest.** Title `Chad Woolley - Resume`,
   description meta, viewport, favicon/app icons, web app manifest
   (>=192x192 and 512x512), robots/canonical per the preview-non-index rule,
   no horizontal scroll.
10. **Scenario test authoring + parity verification.** Author every test
    identifier `scenario-coverage.json` maps (Playwright e2e for
    browser-observable scenarios; Vitest/property/build checks for
    non-browser-exercisable) so `check:scenarios` resolves each identifier to
    an executable test, and verify predecessor parity end-to-end.

## Completion criteria

Phase-1 MVP is complete when:

- Every load-bearing scenario in `SPECIFICATION/scenarios.md` has its mapped
  executable test(s) present and passing; `check:scenarios` resolves every
  identifier.
- `bun run check` passes with all gates ACTIVE (not merely armed) over real
  `src/**`: 100% line+branch coverage, Result/ROP AST checks, property/fuzz
  targets, and scenario resolution.
- Interactive (`/`) and static (`/static`) modes render the committed
  `data/resume.yml` to predecessor parity (18 keys, 16 sections, 74 items).
- The SvelteKit + Vercel-adapter production build succeeds and prerenders.
- No AI answering behavior and no MCP surface were introduced.

## Communication rule

Never talk to a human using only an opaque phase code, work-item id, action
id, version id, or command token. Always pair the token with a human-readable
description of the work and the files or behavior it affects.
