---
topic: claude-opus-4-8-critique
author: claude-opus-4-8
created_at: 2026-07-06T23:09:18Z
---

## Proposal: v017 dropped the 'Local memory guardrails reject unsupported notes' scenario heading

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

In §"Scenarios", the v017 edit that added `### Scenario: Guardrail gates are provisioned additively before the first product-source merge` replaced the following heading `### Scenario: Local memory guardrails reject unsupported notes` instead of inserting before it. That heading is now gone, and its Given/When/Then — the prohibited-private-memory / unindexed-`.ai`-note / dangling-`AGENTS.md`-reference rejection — now dangles as a SECOND Given/When/Then block under the additive-provisioning scenario's heading. Two load-bearing contributor-workflow scenarios are corrupted: the additive-provisioning scenario is malformed (two Given/When/Then blocks under one heading) and the local-memory-rejection scenario has lost its addressable identity.

### Motivation

This is a structural regression introduced by the v017 revise and missed by the doctor-static phase: it produces a contradiction between the intended one-heading/one-Given-When-Then scenario form and the actual merged text. The local-memory-guardrail rejection behavior is load-bearing (it is the aggregate/hook gate for prohibited private-memory paths, per §"Local memory guardrails") yet it no longer has its own scenario heading, and the additive-provisioning scenario is now malformed.

### Proposed Changes

Restore the `### Scenario: Local memory guardrails reject unsupported notes` heading immediately before its Given ("Given a committed file matches a prohibited private-memory pattern, an `.ai/*.md` note is missing from `AGENTS.md`, or `AGENTS.md` references a missing `.ai` note"), so the additive-provisioning scenario keeps only its own Given/When/Then and the local-memory-rejection scenario regains its heading. This is an unambiguous mechanical restoration; no wording of either scenario's body needs to change.

## Proposal: Scenario-coverage package-script row still says Playwright-only after the two-class model

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

§"Package script categories" still describes the scenario-coverage gate with the row `| Scenario coverage | Verify load-bearing scenario-to-Playwright mappings. |`, i.e. Playwright-only. But v017's §"Top-of-pyramid discipline" now requires that gate to verify TWO mapping classes — a Playwright mapping for browser-observable scenarios AND a named non-Playwright category mapping (Vitest / `fast-check` / build-check) plus rationale for non-browser-exercisable scenarios. The command-contract row therefore describes a narrower gate than the one it names.

### Motivation

This is an internal inconsistency left by the v017 two-class revision: the required-behavior contract for the `check:scenarios` script still says 'scenario-to-Playwright mappings', which an implementer could faithfully read as authorizing a Playwright-only check — which would then fail (or force misleading Playwright tests onto) every non-browser-exercisable phase-1 scenario the same revision just legitimized.

### Proposed Changes

Update the `Scenario coverage` row's Required-behavior cell to reference class-appropriate mappings, e.g. "Verify load-bearing scenario-to-test mappings by class: Playwright for browser-observable, a named non-Playwright category plus rationale for non-browser-exercisable." Align the wording with §"Top-of-pyramid discipline" so the script contract and the gate definition agree.

## Proposal: Suite-Green leg scope does not authorize the new test-only infrastructure the Red leg requires

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The Red leg requires supporting test-only infrastructure the anchor test needs to load (fixtures, page objects, component harnesses, snapshots, helper modules) to 'already exist, committed earlier via the Suite-Green leg.' But the Suite-Green leg enumerates its scope as 'a refactor, a chore touching first-party product source, or a passing test-only cleanup' — none of which clearly denotes ADDING NEW test-only supporting infrastructure: test infra is not first-party product source (the v016 definition excludes tests), and adding brand-new infra is not a 'cleanup.' The mechanically-enforced gate therefore mandates a pre-commit path that its own leg-scope list does not clearly authorize. A related edge: the Suite-Green leg 'MUST reject a zero-test run,' so the first supporting-infra commit in a fresh tree (no tests yet) has no valid leg at all.

### Motivation

This is an ambiguity in the most load-bearing gate: a contributor pre-committing a new page object or fixture ahead of the anchor test cannot determine from the Suite-Green scope list whether that commit is a valid Suite-Green, and the zero-test-run rejection leaves the genesis infra commit with no deterministic leg — refining an edge of the settled anchor-test model, not reversing it.

### Proposed Changes

Clarify the Suite-Green scope to explicitly include 'adding or updating test-only supporting infrastructure that introduces no new failing test,' and resolve the empty-suite genesis case (for example: allow the first supporting infrastructure to ride in the first Red -> Green amend, or grant a documented zero-test Suite-Green allowance until the first test exists). Leave the exact resolution to the reviser; the fix MUST give both the pre-commit-infra path and the empty-suite genesis a single deterministic leg.
