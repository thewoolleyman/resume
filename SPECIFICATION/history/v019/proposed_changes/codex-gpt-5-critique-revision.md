---
proposal: codex-gpt-5-critique.md
decision: modify
revised_at: 2026-07-07T01:32:16Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Accept Codex's integration-test-script-contract finding — it is a real, load-bearing ambiguity: §"Package script categories" declares an Integration tests command category and its intro states each category is exposed as a named Bun script, yet the required minimum Bun script list omitted `test:integration`, leaving the package-script verifier (`bun run check` asserting 'every required script exists') without a deterministic answer on whether that script is required. The decision is 'modify' because the resolution combines and sharpens Codex's two either/or options into a single deterministic rule rather than leaving the choice open. No Settled item is touched; this refines the package-script surface edge.

## Modifications

Resolved the single ## Proposal ('Name the integration-test script contract') in non-functional-requirements.md §"Package script categories": added `test:integration` to the required minimum Bun script surface (Codex's option a), inserted right after `test:unit`. Pinned the 'when present' determinism so the verifier has one outcome: the `test:integration` script MUST exist on the same terms as the other named scripts, and when the repository has no non-browser integration suite yet it MAY be a documented pass-with-no-tests equivalent recorded as its stricter-equivalent rationale — so the 'when present' qualifier on the Integration tests command category governs whether integration tests RUN, never whether the named script surface EXISTS. `bun run check` MUST resolve `test:integration` to either the named script or its documented pass-with-no-tests equivalent. No scenario churn is needed: the existing 'Required package-script surface exists' scenario already asserts that 'every required Bun script name exists', which now includes `test:integration`.

## Resulting Changes

- non-functional-requirements.md
