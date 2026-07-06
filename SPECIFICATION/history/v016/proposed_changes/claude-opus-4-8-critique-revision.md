---
proposal: claude-opus-4-8-critique.md
decision: modify
revised_at: 2026-07-06T22:09:57Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: codex-gpt-5
---

## Decision and Rationale

Modify the critique rather than accept it verbatim because all three findings identify real load-bearing gaps, but the resolution should preserve the settled gate-enforced anchor-test TDD model. The revision pins explicit TDD intent plus staged diff shape and evidence trailers as the deterministic leg discriminator, scopes commit-level pairing so Suite-Green refactor/chore commits have one valid path, and defines first-party product source positively while keeping repository harness/tooling out of the product-source pairing gate.

## Modifications

Resolved Proposal 1 by replacing the contradictory content-only/subject-prefix language with explicit machine-readable `TDD-Intent` values selected by tdd-commit or an equivalent trailer, while preserving the rule that commit subject prefix is not the discriminator. Resolved Proposal 2 by stating that pure refactor/chore source changes without staged tests pass pairing only through Suite-Green evidence plus per-file coverage. Resolved Proposal 3 by defining first-party product source as shipped repository-authored src/** implementation files and explicitly excluding harness/tooling, specs, docs, generated artifacts, lockfiles, tests, and governed data snapshots from the TDD pairing and branch-range gates. Updated the TDD enforcement contributor scenario to cover deterministic leg selection and missing/conflicting `TDD-Intent` markers.

## Resulting Changes

- non-functional-requirements.md
