---
proposal: v008-doctor-followups.md
decision: modify
revised_at: 2026-07-06T08:18:26Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: codex-gpt-5
---

## Decision and Rationale

The proposal correctly identifies post-v008 follow-ups, but the clean landing keeps a single authoritative production-section inventory instead of copying the full list into the parity section, and it adds scenario coverage for the two load-bearing-adjacent clauses rather than changing contracts that already state the normative requirements.

## Modifications

Replaced the loose predecessor-parity inventory summary with an explicit pointer to the authoritative pinned production scope in spec.md. Added two phase-1 scenarios: one proving deferred skills/relationships/rich metadata are optional and behave empty, and one proving the search plain-text projection works in a server/build environment without a browser DOM. Left contracts.md unchanged because it already contains the corresponding MUST clauses.

## Resulting Changes

- spec.md
- scenarios.md
