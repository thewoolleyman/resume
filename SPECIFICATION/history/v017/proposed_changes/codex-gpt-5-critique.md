---
topic: codex-gpt-5-critique
author: codex-gpt-5
created_at: 2026-07-06T22:15:03Z
---

## Proposal: Scenario coverage requires Playwright for non-browser phase-1 scenarios

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/scenarios.md

### Summary

The top-of-pyramid gate requires every load-bearing `SPECIFICATION/scenarios.md` scenario to map to a Playwright end-to-end test before it is treated as implemented, but the phase-1 scenario set includes non-browser or build-time invariants such as governed data import/transformation, DOM-free search projection, malformed-data build failure, and pinned production inventory round-tripping. Those scenarios are load-bearing and not marked as non-browser-exercisable, while the exception rule is written only for future scenarios, so the harness has no deterministic valid mapping for existing non-browser phase-1 scenarios.

### Motivation

This is an ambiguity in the scenario coverage contract, not a test-style preference: the aggregate check must decide whether scenarios like `Search projection is generated without a browser DOM` and `Governed data failure never ships a broken resume` require Playwright identifiers, unit/build-check identifiers, or explicit non-browser exceptions. As written, a faithful `check:scenarios` implementation either forces misleading Playwright tests for non-browser behavior or fails the already-ratified phase-1 scenario set forever.

### Proposed Changes

Revise the top-of-pyramid discipline and/or the affected phase-1 scenarios so existing non-browser-exercisable scenarios have an explicit replacement top-level test category. The corrective text MUST distinguish browser-observable phase-1 scenarios that require Playwright mappings from data/build/tooling scenarios that require unit, property, build, or aggregate-check mappings, and `bun run check` MUST fail when either mapping class is missing or stale. The edit MUST leave one deterministic answer for each current `SPECIFICATION/scenarios.md` heading.

## Proposal: Final Red-Green commit trailer shape is still ambiguous after TDD-Intent

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The TDD protocol now introduces an exactly-one `TDD-Intent` trailer with values `Red`, `Green`, or `Suite-Green`, but the Red -> Green path is an amend flow whose final single commit must carry the `TDD-Red-*` / `TDD-Green-*` pair shape. The spec does not state what `TDD-Intent` value the final amended commit carries, whether the intermediate Red commit's `TDD-Intent: Red` is replaced by `TDD-Intent: Green`, or how branch-range validation should interpret a pair-shaped final commit that can only have one intent value.

### Motivation

This is an ambiguity in the most load-bearing gate. The v016 design record resolved leg selection by introducing `TDD-Intent`, while the settled design record preserves the final single anchor-test commit with both Red and Green evidence. Those two decisions are compatible only if the final trailer set is pinned; otherwise commit-msg and `origin/master..HEAD` validation can disagree on whether a valid final pair-shaped commit has `TDD-Intent: Green`, both intents, no intent, or some separate pair intent.

### Proposed Changes

Pin the exact trailer grammar for each durable commit state. For example, state that the temporary Red commit carries `TDD-Intent: Red`, the amended final Red -> Green commit carries `TDD-Intent: Green` plus all required `TDD-Red-*` and `TDD-Green-*` trailers, and Suite-Green commits carry `TDD-Intent: Suite-Green` plus only the Suite-Green trailers; or choose another explicit grammar. The branch-range validation rule MUST reference that grammar so a final amended commit has exactly one valid interpretation.

## Proposal: Guardrail bootstrap boundary is undefined

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

Many required gates must exist `before the first non-trivial implementation merge`, but the spec does not define whether the guardrail harness itself is that first non-trivial implementation merge or a bootstrap phase before it. The package-script surface, bootstrap hook installation, CI workflows, branch-protection verification, coverage thresholds, property-test reproducibility, and memory hook gates all depend on tooling that does not exist until the harness is implemented, so the first harness commits have no deterministic compliance boundary.

### Motivation

This is an undefined activation boundary in the guardrail contracts. The design-of-record says the first real code is the harness, but the normative spec gates repeatedly trigger before the first non-trivial implementation merge without defining a temporary bootstrap allowance, a stricter self-hosting requirement, or a cutover commit. A harness builder cannot know which checks must already pass while creating `bootstrap`, `bun run check`, hooks, and CI, and which checks become mandatory only after those artifacts exist.

### Proposed Changes

Define the bootstrap boundary explicitly. The spec MUST name whether `first non-trivial implementation merge` means the first product-source merge after the guardrail harness lands, the first harness/tooling merge, or a named cutover commit. It MUST also state which gates are active during harness bootstrap, which are permitted to be temporarily absent only while being implemented, and what committed evidence flips the repository into fully enforced mode.

## Proposal: Coverage thresholds are required but have no enforceable floor

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The coverage gate requires explicit line, branch, and function thresholds and says first-party core thresholds must be higher than framework glue, but it never defines any minimum values or acceptance floor. A harness can satisfy the letter of the spec with arbitrarily low thresholds, as long as core thresholds are numerically higher than framework glue, which makes the gate's strength undefined.

### Motivation

This is an ambiguity in a gate-enforced quality contract. The harness needs a deterministic pass/fail policy, and the current wording leaves the most load-bearing decision — how much coverage is enough for phase-1 core logic — to implementer choice. That weakens the guardrail while still allowing the discipline inventory to claim coverage enforcement.

### Proposed Changes

Pin concrete minimum line, branch, and function coverage floors for first-party core modules and for framework glue, or define a machine-checkable policy that derives them. The corrective text MUST prevent zero-or-near-zero thresholds from satisfying the gate, MUST state how per-module exemptions are represented and checked, and MUST keep the higher-core-than-glue relationship enforceable.
