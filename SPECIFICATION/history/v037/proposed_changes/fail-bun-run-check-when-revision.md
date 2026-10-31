---
proposal: fail-bun-run-check-when.md
decision: modify
revised_at: 2026-10-31T18:41:16Z
author_human: Chad Woolley <thewoolleyman@gmail.com>
author_llm: claude-opus-5-5 (petri-factory-on-gmktec)
---

## Decision and Rationale

§"Factory routing" states two MUST rules for the committed `.livespec.jsonc` that nothing enforces; wiring them into the aggregate check closes that gap in the same standalone-gate pattern the comment-discipline clause uses. Placement is contributor-only, so non-functional-requirements.md per this repo's taxonomy. Independent read-only review: NO BLOCKERS.

## Modifications

The scenario's Then line is normalised to this file's convention (no Then line in non-functional-requirements.md §"Scenarios" uses BCP14): "the check MUST exit non-zero ... the factory-routing gate MUST pass" becomes "the check exits non-zero ... the factory-routing gate passes". The normative MUSTs remain in the §"Factory routing" clause, which is accepted verbatim as proposed.

## Resulting Changes

- non-functional-requirements.md

## Ratification Review

ratification_review: auto-spawn
reviewer_model: sonnet
reviewer_identity: sonnet
separate_reviewer: True
read_only: True
reviewed_at: 2026-10-31T18:39:34Z
verdict: NO BLOCKERS
proposal_stem: fail-bun-run-check-when
content_digest: 3220c50821518c9aff6a916d8e51f34ffd23c68a02e13463753a0850e037e425
