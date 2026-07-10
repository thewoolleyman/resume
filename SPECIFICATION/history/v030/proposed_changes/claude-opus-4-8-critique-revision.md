---
proposal: claude-opus-4-8-critique.md
decision: accept
revised_at: 2026-07-10T08:43:22Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Accept: align constraints.md §"Predecessor data migration boundary" with the ratified spec.md §"Governed data source and predecessor import (phase 1)" model. constraints.md still asserted a byte-verbatim committed snapshot with a single content hash, directly contradicting spec.md as amended by v027 (owner-directed PII redactions, two-hash provenance, need-not-be-byte-identical) and v029 (owner-authored about-content edits). The resolution ALIGNS constraints.md with its cited design record (spec.md's import provision) rather than departing from it, so the intent-preservation gate needs no departure acknowledgment. constraints.md now cross-references that spec.md provision (two SHA-256 hashes plus the per-edit ledger) instead of restating a stricter rule, removing the ratified-file contradiction. No new behavior is introduced (the two-hash/redaction/owner-edit behavior is already specified and scenario-backed in spec.md), so no new scenarios.md clause is required.

## Resulting Changes

- constraints.md
