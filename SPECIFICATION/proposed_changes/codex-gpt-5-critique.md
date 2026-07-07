---
topic: codex-gpt-5-critique
author: codex-gpt-5
created_at: 2026-07-07T01:21:49Z
---

## Proposal: Name the integration-test script contract

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The package-script section requires every command category to be exposed as a named Bun script, and the table includes an Integration tests category, but the required minimum Bun script surface omits a `test:integration` script. The aggregate check also MUST include integration tests when present, leaving the harness contract unclear about whether CI should require a separate script, fold integration tests into another script, or only verify a documented absence.

### Motivation

This ambiguity is load-bearing because the package-script verifier and CI wiring need a deterministic script surface before the first non-trivial implementation merge. As written, an implementation could satisfy the minimum script list while silently failing the table-level requirement for a named integration-test command category.

### Proposed Changes

Clarify the integration-test command contract in `SPECIFICATION/non-functional-requirements.md`: either add `test:integration` to the required minimum Bun script list, or explicitly state the documented stricter-equivalent rule for repositories with no separate integration suite. The aggregate check requirement SHOULD fail unless it can resolve either a named integration-test script when integration tests exist or a committed rationale proving there are no non-browser integration tests yet.
