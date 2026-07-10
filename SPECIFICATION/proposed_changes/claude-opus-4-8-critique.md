---
topic: claude-opus-4-8-critique
author: claude-opus-4-8
created_at: 2026-07-10T05:18:28Z
---

## Proposal: constraints-verbatim-snapshot-contradiction

### Target specification files

- SPECIFICATION/constraints.md

### Summary

constraints.md §"Predecessor data migration boundary" still mandates that "a verbatim snapshot of the predecessor's production content MUST be committed into data/resume.yml" with its provenance recorded as "source URL, retrieval date, upstream Last-Modified, and content hash" (a single hash). That directly contradicts spec.md §"Governed data source and predecessor import (phase 1)" as amended by v027 (the committed snapshot MAY carry owner-directed PII redactions and need NOT be byte-identical, with a two-hash provenance: retrieved-source SHA-256 plus committed-snapshot SHA-256) and by v029 (the committed snapshot MAY additionally carry owner-authored about-content edits). The two ratified spec files describe the SAME committed data/resume.yml in mutually exclusive terms: verbatim/single-hash vs. intentionally-divergent/two-hash.

### Motivation

This is an unresolved contradiction between two ratified spec files: constraints.md asserts the committed snapshot is byte-verbatim while spec.md (v027, v029) sanctions PII redactions and owner-authored content edits that make it deliberately non-verbatim. The v027 accept-revision (SPECIFICATION/history/v027/proposed_changes/permit-owner-pii-redaction-in-snapshot-revision.md) explicitly claimed 'No contracts.md, constraints.md, or scenarios.md change is needed', which was incorrect for constraints.md; v029 widened the divergence. Surfaced as a doctor objective-phase finding; the design records cited above show spec.md's redaction/owner-edit model is the intended resolution, so constraints.md is the stale artifact — but this finding leaves the resolution to the maintainer rather than self-editing constraints.md.

### Proposed Changes

In constraints.md §"Predecessor data migration boundary", the sentence beginning "So this parity does not depend on a live external fetch, a verbatim snapshot ... MUST be committed" MUST be revised to match spec.md §"Governed data source and predecessor import (phase 1)": the committed data/resume.yml MUST be transcribed from the predecessor's production content and MAY diverge from the retrieved source via owner-directed PII redactions and owner-authored content edits recorded in that file's provenance comments; it need NOT be byte-identical. The provenance recorded MUST be the two-hash model (retrieved-source SHA-256 plus committed-snapshot SHA-256) plus the redaction/edit ledger, cross-referenced to spec.md rather than restated. constraints.md MUST NOT continue to assert a stricter byte-verbatim single-hash rule.
