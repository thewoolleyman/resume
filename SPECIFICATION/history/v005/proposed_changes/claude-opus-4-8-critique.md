---
topic: claude-opus-4-8-critique
author: claude-opus-4-8
created_at: 2026-07-06T00:03:43Z
---

## Proposal: Interactive loading state is unspecified

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

The interactive rendering contract specifies post-load hash navigation and a data-load-failure state, but nothing about the in-progress loading state. A faithful port needs an explicit loading affordance and the load lifecycle (loading -> loaded/failed).

### Motivation

The predecessor (`pages/index.vue` + store `isLoading`) renders a loading spinner while governed data loads, then on load completion (`isLoading` false) scrolls to any `window.location.hash` anchor. The current spec captures the post-load hash reveal and the failure state but has no clause or scenario for the loading indicator, so a re-implementation could omit it and still satisfy the spec.

### Proposed Changes

In `contracts.md` §"Interactive rendering contract", add a clause: while governed resume data is loading, interactive mode MUST show a loading indicator, and MUST render the resume once loading completes; the hash/anchor reveal (already required to wait for load completion) fires after the loaded state is reached. Add a `scenarios.md` scenario, e.g. "Interactive mode shows a loading indicator while data loads": Given governed data has not finished loading / When a visitor opens the interactive resume / Then a loading indicator is shown until the data loads and the resume renders.

## Proposal: Search matching semantics are unspecified

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

The Search contract says search operates over item names plus the markdown-stripped description and must not match markup, but it does not pin the observable matching contract: case-insensitivity and partial/token matching. Without this, 'drive-able' is ambiguous.

### Motivation

The predecessor search (`util/search.js` via Fuse.js; test asserts `'bow'` matches `'Bow hunting'`) is case-insensitive and matches partial tokens. The current spec deliberately does NOT require reusing Fuse.js, so the observable matching behavior must be stated independently of the algorithm to be re-implementable.

### Proposed Changes

In `contracts.md` §"Interactive rendering contract" -> Search, add: search MUST be case-insensitive and MUST match partial tokens or substrings within governed item names and the plain-text (markdown-stripped) description; the exact matching algorithm (fuzzy vs. substring vs. token) remains an implementation choice. Refine the existing search scenario(s) to assert case-insensitive partial matching (e.g., `bow` matches `Bow hunting`).

## Proposal: Section identity and legacy-anchor ordinal derivation are under-specified

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md

### Summary

The spec derives sections from the remaining top-level data groups and preserves legacy `#list-<ordinal>` anchors, but never states that a section's name IS its data-group name, that section and item order follow governed data order, or how the legacy ordinal is derived. These must be deterministic for a faithful port.

### Motivation

In the predecessor (`util/transformData.js`: `listName` is the data key, `listId = index + 1`; `ItemListHeader` renders anchor `list-${id}`; `NavContentsMenu` links `#list-${id}`), each section's display name is its data-group key, sections and items render in governed data order, and the legacy `#list-<n>` anchor's `n` is the section's 1-based position in that order.

### Proposed Changes

In `spec.md` §"Predecessor data model parity" (and/or the `contracts.md` resume-data / interactive contracts), state: each section's display name is its governed data group's name; sections render in governed data order; items render in governed data order by default (the 'Default' sort); and the legacy `#list-<n>` anchor's `n` is the section's 1-based ordinal in that order, with the preserved alias or deterministic redirect mapping that ordinal to the section's stable identifier.

## Proposal: Interactive rendering precision: level indicator and no-match structure

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

Two rendering details are ambiguous: whether the level indicator shows the level key or its explanation, and whether a no-match search preserves section headers. The predecessor pins both; the spec should too.

### Motivation

Predecessor `ItemListLineItem.vue` renders a badge showing the level KEY (e.g. `played`) with a hover popover giving the human-readable explanation (or `unknown level` for an invalid level). Predecessor `ItemList.vue` empties item rows on a no-match search while section headers/structure persist (the empty state is per-section, not a whole-page replacement).

### Proposed Changes

In `contracts.md` §"Interactive rendering contract": (item rendering) the level indicator MUST display the level key with the human-readable level explanation available on interaction (hover/focus), and MUST show a diagnostic label (e.g. `unknown level`) for an invalid level while keeping the item visible; (search) on a no-match query, section headers and structure MUST persist while the affected item rows are empty. Add a scenario asserting section headers remain on a no-match search.

## Proposal: Browser-metadata parity is incomplete

### Target specification files

- SPECIFICATION/constraints.md

### Summary

§"Browser metadata parity" covers page title, viewport, favicon, robots/canonical, and no-horizontal-scroll, but omits the description meta tag, the exact responsive viewport string, and any decision on PWA installability.

### Motivation

The predecessor `nuxt.config.js` sets viewport `width=device-width, initial-scale=1, shrink-to-fit=no` and a description meta tag, and `static/manifest.json` ships a standalone PWA manifest with 192x192 and 512x512 icons. For complete parity the spec must either require or explicitly defer these.

### Proposed Changes

In `constraints.md` §"Browser metadata parity", add: a description meta tag; the responsive viewport `width=device-width, initial-scale=1, shrink-to-fit=no` (or a documented equivalent); and an explicit decision on PWA installability — either require a documented web-app manifest (standalone display + app icons) or explicitly defer PWA as out of scope for the initial port.

## Proposal: Record delivery phasing: interactive/static is phase 1, AI/MCP deferred

### Target specification files

- SPECIFICATION/spec.md

### Summary

The stated intent to get the basic port up first (fully specified and drive-able) and defer AI/MCP deep refinement is not recorded. Add an explicit phasing clause so the interactive/static parity scope is treated as the complete phase-1 deliverable.

### Motivation

User steering for this critique: focus on getting the basic port up; the interactive re-implementation of the existing app must be fully specified and drive-able, while the AI/MCP side can be deferred for deep refinement. The current spec treats AI/MCP details as 'implementation choices until a future proposed change' but does not state that interactive+static parity is the phase-1 must-be-complete scope.

### Proposed Changes

In `spec.md` (e.g. §"Product intent" or a new §"Delivery phasing"), state: the interactive and static resume modes reproducing predecessor parity are the phase-1 scope and MUST be fully specified and drive-able before implementation begins; the AI-driven and MCP surfaces are deferred to a later phase and remain non-load-bearing until a future proposed change specifies them. This does not remove the existing AI/MCP intent, contracts, or safety constraints — it scopes their detailed specification to a later phase.
