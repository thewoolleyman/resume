---
proposal: codex-gpt-5-critique.md
decision: modify
revised_at: 2026-07-06T01:04:37Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Accepted the direction of all ten sub-proposals in the codex-gpt-5 critique and authored concrete phase-1 predecessor-parity spec text for each, because the critique correctly identified load-bearing ambiguities and contradictions that would let two implementers diverge while both claiming compliance. Contradictions were resolved toward the predecessor's actual observable behavior (verified against the ../interactive-resume.gitlab.io source), except the two explicit user decisions captured during the revise dialogue: the search no-results state keeps an explicit message as a deliberate enhancement over the predecessor's silent empty sections, and PWA installability is required (a manifest with standalone display plus 192x192 and 512x512 icons) rather than deferred. Every new load-bearing behavior was co-edited as a MUST/SHOULD clause plus a Gherkin scenario per the authoring discipline.

## Modifications

Authored the concrete clauses and scenarios the directional proposals called for rather than accepting their prose verbatim. spec.md: added 'Delivery phases', 'Governed data source and predecessor import (phase 1)', and 'Stable item identifiers' sections and marked AI/MCP non-load-bearing. contracts.md: added 'Governed data source contract', 'Data-load lifecycle', promoted the layout sketch to 'Layout and controls' requirements, added 'About and Instructions controls', rewrote 'Search' (canonical result order + compose order + explicit no-results), resolved the invalid-skill-level SHOULD/MUST contradiction to MUST-visible-with-unknown-level, pinned the seven sort options with missing-date and tie-break semantics, and labeled /ai + AI/MCP contracts later-phase. scenarios.md: added phase-1 scenarios for import, malformed data, item-id derivation, responsive shell, hash no-op, offset anchor, search composition, and date-sort edges, and moved AI/MCP scenarios under 'Later-phase scenarios (non-load-bearing in phase 1)'. constraints.md: required the PWA manifest and responsive no-horizontal-scroll layout and tied the data-migration boundary to the single canonical governed source. User-directed judgment calls: keep an explicit no-results message (P5), require the PWA manifest (P9/P11), and derive item IDs by deterministic section+item-name slug (P3).

## Resulting Changes

- spec.md
- contracts.md
- scenarios.md
- constraints.md
