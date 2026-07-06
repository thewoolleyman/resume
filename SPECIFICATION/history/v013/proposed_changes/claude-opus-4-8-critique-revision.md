---
proposal: claude-opus-4-8-critique.md
decision: modify
revised_at: 2026-07-06T18:35:10Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: codex-gpt-5
---

## Decision and Rationale

Accept the critique's enforcement concerns, but land them as a concrete non-functional revision rather than preserving either/or alternatives. The update gives the discipline inventory explicit enforcement classes, makes TDD process-enforced through a repository-local evidence gate, defines the livespec-dev-tooling-inspired guideline source in committed local terms, and records property-based testing as the TypeScript adaptation of the seed's fuzzing discipline with malformed/adversarial cases included.

## Modifications

Resolved all four proposal sections in SPECIFICATION/non-functional-requirements.md. The revision splits enforcement classes so documentation cannot masquerade as a failing gate, adds a TDD evidence gate wired into the aggregate-check contract, enumerates the local livespec-dev-tooling-inspired guidelines instead of relying on a sibling checkout, and states that deterministic property-based tests over valid plus malformed/adversarial inputs are the phase-1 TypeScript adaptation of the fuzzing dial.

## Resulting Changes

- non-functional-requirements.md
