---
topic: v008-doctor-followups
author: claude-opus-4-8
created_at: 2026-07-06T06:12:28Z
---

## Proposal: Align the Predecessor-data-model-parity section list with the pinned exact production keys

### Target specification files

- SPECIFICATION/spec.md

### Summary

spec.md §"Predecessor data model parity" summarizes the section inventory in a loose form ("Writings/Publications/Presentations/Awards" with slashes, "the Skills/Tools section families") while the v008 §"Governed data source and predecessor import (phase 1)" now pins the exact production keys and order. Align the parity summary with the pinned inventory so the two lists cannot silently diverge.

### Motivation

Doctor LLM subjective prose-quality finding surfaced in the v008 revise post-step: the parity section's section-name spellings differ from the newly pinned exact production keys.

### Proposed Changes

In spec.md §"Predecessor data model parity", either (a) replace the loose slash-form names and the "Skills/Tools section families" summary with the exact pinned keys from §"Governed data source and predecessor import (phase 1)" ("Writings, Publications, Presentations, and Awards" and the ten explicit "Skills/Tools - ..." section names), or (b) state explicitly that this list is a non-exhaustive human-readable summary and that the pinned inventory in §"Governed data source and predecessor import (phase 1)" is authoritative. Keep a single authoritative inventory to avoid drift.

## Proposal: Add scenarios (or confirm scoping-exemption) for deferred collections and DOM-free search projection

### Target specification files

- SPECIFICATION/scenarios.md
- SPECIFICATION/contracts.md

### Summary

Two v008 clauses are stated as MUST rules without a paired Gherkin scenario: the phase-1 default-empty scoping for the skills/relationships/metadata collections, and the requirement that the markdown-stripped search projection be produced without a browser-DOM dependency. Either add scenarios exercising them, or record them as non-observable scoping/mechanism constraints exempt from the behavior-implies-scenario split.

### Motivation

Doctor LLM objective delta-uncovered-behavior finding surfaced in the v008 revise post-step: both clauses are load-bearing-adjacent but have no matching scenario.

### Proposed Changes

Add, if warranted, (a) a scenario asserting that a phase-1 governed source with no skills-taxonomy/relationships/metadata still loads and completes phase-1 (the collections default to empty and are not required), and (b) a scenario or note that the searchable plain-text projection is produced during server/build rendering with no DOM. Alternatively, document in contracts.md that these are scoping/implementation-mechanism constraints not subject to the Gherkin-scenario requirement. Low priority; neither blocks phase-1 drive-ability.
