---
topic: codex-gpt-5-critique
author: codex-gpt-5
created_at: 2026-07-06T00:25:30Z
---

## Proposal: Phase-1 scope contradicts AI and MCP route requirements

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

The spec says phase 1 is the basic interactive/static port and that AI/MCP details are deferred, but the functional contracts still require `/ai`, AI chat response records, AI scenarios, and future MCP scenarios in the same acceptance surface. That leaves implementers unclear whether phase-1 completion requires an AI route and AI behavior or whether those requirements are intentionally non-load-bearing.

### Motivation

This is a contradiction for the requested basic port focus: one section says AI/MCP are deferred and non-load-bearing, while route and scenario sections still read as phase-1 requirements. A drive-able predecessor port needs a clear phase boundary so implementers do not spend phase-1 work on AI/MCP or accidentally fail the spec by omitting it.

### Proposed Changes

Split phase-1 and later-phase requirements explicitly. `spec.md` SHOULD define phase-1 as interactive plus static predecessor parity, and AI/MCP as later-phase planned surfaces. `contracts.md` SHOULD mark `/ai`, AI chat records, and MCP contract clauses as later-phase requirements or define a phase-1 placeholder route if one is required. `scenarios.md` SHOULD either move AI/MCP scenarios to a later-phase section or mark them non-load-bearing until a future proposed change activates them.

## Proposal: Governed data source and predecessor import contract are under-specified

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md
- SPECIFICATION/constraints.md
- SPECIFICATION/scenarios.md

### Summary

The predecessor app loads a YAML document with top-level `about`, `header`, and arbitrary section keys, parses dates and markdown, and normalizes sections/items in insertion order. The current spec names a conceptual structured source but is silent about the concrete phase-1 file path, source format, required imported production content, date scalar format, markdown allowance, and how the old production YAML is transcribed into the governed source.

### Motivation

The ambiguity is load-bearing because two implementers could choose incompatible canonical data files or schemas and both claim compliance. A full reimplementation of the existing app needs the functional data contract to be precise enough to import the predecessor production YAML without guessing.

### Proposed Changes

Add a phase-1 governed-data contract that names the canonical source path and format. It MUST require the predecessor production content to be imported into that source, preserving `about.title`, markdown `about.content`, `header.name`, `header.contact`, top-level section names, item order, item `name`, optional `level`, optional `start`, optional `end`, and markdown `desc`. It SHOULD specify accepted date representations and whether markdown may contain raw HTML. Add scenarios for importing the predecessor production YAML and for rejecting/mapping malformed required fields.

## Proposal: Stable item identifiers are required but no derivation rule exists

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

The new spec requires every resume item to have a stable identifier and supports stable item anchors, but the predecessor data has no item IDs and the predecessor UI only exposes numeric generated list anchors such as `#list-1`. The spec does not say whether imported data must gain explicit IDs, how IDs are derived for legacy items, or how deep links remain stable across content reordering.

### Motivation

This is undefined behavior at the core navigation boundary. Without a deterministic identifier migration rule, implementations can produce incompatible anchors and future MCP/API references from the same predecessor data.

### Proposed Changes

Define the phase-1 item identity migration. The spec MUST either require explicit stable item IDs in the governed data source during import, or define a deterministic slug/ID derivation from section name plus item name with collision handling. It MUST state how legacy generated numeric item/list IDs map to new stable identifiers, which anchors are public, and what happens when content is renamed or reordered. Add a scenario that imports predecessor data with no item IDs and verifies stable item anchors are produced deterministically.

## Proposal: About and Instructions controls are not fully specified

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

The spec says About and Instructions controls exist, but it does not capture that About renders `about.title` as the modal title and markdown-rendered `about.content` as the modal body, or that Instructions has a fixed user-facing checklist describing search, contents, skill-level filtering, collapse/expand, per-section sorting, and reset behavior.

### Motivation

The current wording is ambiguous because a reimplementation could satisfy it with arbitrary modal content or omit the static instructions copy. Those controls are part of the predecessor's functional UI and should be drive-able without reading the old Vue component.

### Proposed Changes

In `contracts.md`, specify the About modal data binding and markdown rendering. Specify the Instructions modal's required functional topics, or exact copy if predecessor parity requires exact text. In `scenarios.md`, expand the About/Instructions scenario to assert that About uses governed `about.title` and `about.content`, and that Instructions explains search, Contents, Skill Levels, collapse/expand, sorting, and Reset.

## Proposal: Search and no-results behavior remain ambiguous

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

The predecessor searches item names and markdown-stripped descriptions using Fuse, then sorts matched IDs back into canonical numeric order before each section filters by membership. The current spec allows several matching algorithms, does not specify result ordering or interaction with skill filters and sorting, and says no-match queries show an explicit empty state even though the predecessor preserves section headers with empty rows and no explicit message.

### Motivation

The ambiguity changes observable behavior: fuzzy matching, substring matching, match ordering, section preservation, and no-results copy can diverge while still appearing to satisfy the current prose. The explicit empty-state wording is also inconsistent with the predecessor unless the port intentionally changes that behavior.

### Proposed Changes

Pin the observable search contract for phase 1. It MUST define the searchable fields, case handling, partial/fuzzy tolerance, whether match output is canonical item order rather than relevance order, and how search composes with skill-level filters and per-section sorting. It MUST resolve the no-results contradiction by either preserving the predecessor's header-only empty sections without message, or intentionally requiring a new explicit no-results message. Add scenarios covering search plus skill-filter composition, search plus section sort composition, canonical result order, and no-match rendering.

## Proposal: Date parsing and sorting edge cases are not drive-able

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

The current spec states date display and sort names, but it does not fully specify how date inputs are parsed, how missing start values participate in start-date sorts, the exact allowed sort values, what invalid sort input does, or the tie-break direction for descending sorts. The predecessor uses parsed date milliseconds, `0` for missing values, treats missing end as current by boosting its sort value, and falls back to name order on equal dates.

### Motivation

This is unclear enough for incompatible implementations: missing start dates could sort first or last, invalid sort values could be rejected or reset, and descending tie-breakers could use ascending or descending names. The predecessor tests cover these edge cases, so the functional spec should too.

### Proposed Changes

Expand `contracts.md` per-section sorting and item rendering to define accepted date input shape, display formatting, internal ordering semantics for missing start and end dates, exact sort option identifiers/labels, name collation, tie-break direction for each sort, and invalid sort behavior. Add scenarios for missing-start start-date sorting, missing-end end-date sorting, equal-date name tie-breaks, and invalid sort fallback or rejection.

## Proposal: Skill-level filtering and invalid-level behavior conflict

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

`contracts.md` says invalid legacy levels SHOULD remain visible, while the newer item-rendering clause says invalid levels MUST keep the item visible and show an `unknown level` diagnostic. The predecessor also always keeps invalid-level items visible regardless of selected filters, while items with no level behave as `unspecified` for filtering but do not display an `unspecified` badge.

### Motivation

The SHOULD/MUST inconsistency is a direct contradiction, and the unspecified/invalid distinction is ambiguous. Implementers need to know whether invalid levels bypass filters, whether `unspecified` is rendered as a badge, and whether the diagnostic is visitor-facing or implementation-visible.

### Proposed Changes

Make the invalid-level rule consistent and normative. The spec MUST state that invalid legacy levels remain visible regardless of selected skill filters and expose the original invalid key plus an `unknown level` explanation. It MUST state that missing levels filter as `unspecified` and whether an `unspecified` badge is rendered. Add scenarios for invalid-level visibility after deselecting every known level, missing-level filtering, and level tooltip/explanation behavior.

## Proposal: Loading failure and hash-navigation lifecycle is incomplete

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

The predecessor renders nav/header immediately, shows a spinner while data loads, renders data after successful parse/transform, and only then scrolls to the current hash target. On failures it displays an error alert. The current spec has isolated loading, hash, and failure clauses but does not specify the full lifecycle, which failure classes are included, or what remains visible during loading and failure.

### Motivation

The lifecycle is ambiguous across fetch failure, malformed data, parse failure, transform failure, missing hash targets, and reset-after-hash. Different implementations can show blank screens, navigate too early, or hide the shell during loading while still satisfying the loose clauses.

### Proposed Changes

Define the phase-1 data-load state machine: initial shell render, loading indicator, success render, failure render, and hash reveal after successful render. It MUST cover fetch errors, malformed governed data, parse errors, missing anchor targets, and reset clearing hash state. Add scenarios for shell-visible-during-loading, hash target after successful load, missing hash no-op, fetch failure, and malformed data failure.

## Proposal: Layout and responsive shell parity is too schematic

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/constraints.md
- SPECIFICATION/scenarios.md

### Summary

The predecessor's visible shell has a specific functional layout: a sticky dark responsive navbar with search, Contents, Skill Levels, Reset, right-aligned Instructions and About; a dark centered header; secondary section bars with arrow toggles and sort controls; rows with item/name-level, date, and markdown description columns; and a hidden offset anchor to avoid sticky-nav overlap. The spec's ASCII sketch is not precise enough to recreate these observable behaviors.

### Motivation

This is an ambiguity in the functional spec, not just visual styling: responsive navbar collapse, control order, anchor offset behavior, column roles, and section-header controls affect user workflows and testability. A basic port can drift substantially from the predecessor while satisfying the current schematic.

### Proposed Changes

Promote the shell layout from sketch to requirements. `contracts.md` SHOULD define control order, responsive collapse behavior, right-aligned modal controls, section header structure, collapse arrow state, sort-control placement, row column responsibilities, and sticky-nav offset behavior. `constraints.md` SHOULD capture supported mobile/desktop layout expectations. `scenarios.md` SHOULD add responsive/nav-shell and sticky-anchor-offset scenarios.

## Proposal: Browser metadata and PWA parity still leaves the decision open

### Target specification files

- SPECIFICATION/constraints.md
- SPECIFICATION/scenarios.md

### Summary

The spec now says phase 1 must either serve a PWA manifest or document PWA installability as out of scope, but it does not make the actual phase-1 decision. The predecessor served `manifest.json` with `short_name`, `name`, `start_url`, `display: standalone`, favicon, and 192/512 icons, so a faithful port remains unclear.

### Motivation

This is intentionally silent rather than drive-able: implementers still have to choose whether PWA installability is part of phase 1. The user asked for the existing app to be completely captured before implementation, so this should become a decided requirement, not an instruction to decide later.

### Proposed Changes

Resolve the PWA decision in `constraints.md`. For strict predecessor parity, require a web app manifest with `short_name`, `name`, `start_url`, `display: standalone`, favicon, and app icons at least equivalent to 192x192 and 512x512. If intentionally deferred, move it to a later-phase/non-goal clause and update the browser metadata scenario to assert that deferral.
