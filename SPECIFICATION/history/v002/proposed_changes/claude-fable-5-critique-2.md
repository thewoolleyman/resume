---
topic: claude-fable-5-critique
author: claude-fable-5
created_at: 2026-07-04T08:35:44Z
---

## Proposal: define-governed-resume-data

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md
- SPECIFICATION/constraints.md

### Summary

Doctor LLM objective finding (doctor-llm-objective-undefined-term, severity high): "governed resume data" is the load-bearing term of the entire specification — grounding of AI answers, citation targets, MCP exposure, the data-authority constraint, and the static/interactive rendering contracts all reference it — yet no file defines it. Nothing states where the governed data set lives, what its source-of-truth format is, who may change it, or how the "explicitly governed supporting facts" mentioned in spec.md's Product intent become governed.

### Motivation

The spec's central term is undefined, so every requirement built on it is ambiguous: two implementers could not agree on which facts the AI may cite, what the MCP server may expose, or what "all governed resume data" means for static rendering. The spec is silent on the governance mechanism the very word "governed" implies.

### Proposed Changes

spec.md MUST define "governed resume data" once, in the "Resume data" section: the set of resume facts stored in the repository's canonical structured data source (single source of truth), changed only through normal version-controlled review, and enumerated as profile, sections, items, skills, relationships, and metadata per contracts.md. The definition MUST state how supporting facts beyond the core resume become governed (they MUST be added to the same canonical data source before any surface may use them; facts not in the canonical source are ungoverned and MUST NOT be cited, rendered, or exposed via MCP). contracts.md and constraints.md MUST reference this single definition instead of treating the term as self-evident.

## Proposal: add-scenarios-for-partial-and-declined-ai-statuses

### Target specification files

- SPECIFICATION/scenarios.md
- SPECIFICATION/contracts.md

### Summary

Doctor LLM subjective finding (doctor-llm-subjective-behavior-coverage, severity medium): the AI chat contract defines four response statuses (answered, partial, unanswerable, declined), but scenarios.md exercises only the answered and unanswerable paths. Under the top-of-pyramid discipline, only scenarios in scenarios.md force end-to-end coverage, so the partial and declined behaviors would ship without an acceptance gate.

### Motivation

The spec is silent at the scenario level on two of the four contractual AI outcomes, leaving it ambiguous whether the partial and declined paths are acceptance-gated behavior or optional polish; the coverage gate as written would never catch a regression in either path.

### Proposed Changes

scenarios.md MUST add two scenarios. (1) "Visitor asks a partially answerable AI question": Given the governed resume data covers only part of a visitor's question, When the visitor asks it in AI-driven mode, Then the app returns a partial answer with citations for the supported portion and states what the governed data does not cover. (2) "Visitor makes an unsafe or off-topic AI request": Given a visitor request that the app's declared decline rules match, When the visitor submits it in AI-driven mode, Then the app returns a declined response that states the reason category and does not fabricate resume facts.

## Proposal: add-scenario-for-interactive-search-and-filter

### Target specification files

- SPECIFICATION/scenarios.md
- SPECIFICATION/contracts.md

### Summary

Doctor LLM subjective finding (doctor-llm-subjective-behavior-coverage, severity medium): contracts.md's interactive rendering contract binds load-bearing search behavior — search operates only over governed resume data, an empty query restores the default ordered view, and a no-match query shows a no-results state without losing the current mode — but no scenario in scenarios.md exercises any of it, so the top-of-pyramid gate never forces an end-to-end test.

### Motivation

Load-bearing contractual behavior with no acceptance scenario leaves the coverage obligation undefined and the contract effectively unenforced; the gap is inconsistent with the project's own rule that every user-facing behavior is scenario-gated before it is considered implemented.

### Proposed Changes

scenarios.md MUST add a scenario "Visitor searches the interactive resume": Given the governed resume data contains items matching a search term, When the visitor enters that term in interactive mode, Then only matching governed items are shown; When the visitor clears the query, Then the default ordered view is restored; and When the visitor enters a term with no matches, Then a no-results state is shown and the visitor remains in interactive mode.
