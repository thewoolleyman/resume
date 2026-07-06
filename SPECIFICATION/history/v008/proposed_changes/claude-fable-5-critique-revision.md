---
proposal: claude-fable-5-critique.md
decision: modify
revised_at: 2026-07-06T04:59:18Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

All seven sub-proposals identify real, verified gaps in phase-1 predecessor-parity drive-ability, so the file is accepted rather than rejected. It is recorded as modify rather than accept because two things had to be reshaped: (1) sub-proposal 1(a)'s instruction to commit the production YAML and sub-proposal 7's ask to author a concrete worked example are implementation actions the revise operation cannot perform (it edits only SPECIFICATION/ spec files), so they are expressed here as spec requirements that such a snapshot and worked example exist, with the artifacts left to downstream implementation work; and (2) the proposals offering an explicit (a)/(b) choice were resolved under the maintainer's steering (preserve predecessor behavior/intent/visibility, follow modern TypeScript/Svelte conventions): data load = build-time prerender, authoring schema = predecessor's human-friendly shape, sanitization = preserve owner-authored HTML, date separator = the predecessor's non-breaking-space-and-hyphen. The pinned production inventory (18 keys, 16 sections in order, 74 items, five skill levels) was verified against the live production YAML before pinning.

## Modifications

Relative to the proposal: (1) the 'commit a verbatim snapshot' and 'author a search worked example' asks are recorded as spec requirements (a committed snapshot with provenance MUST exist; a worked example MUST be authored alongside the committed dataset) rather than performed, since revise edits only spec files; provenance values were filled in from a live fetch (SHA-256 792097b0..., retrieved 2026-07-06, upstream Last-Modified 2022-06-27). (2) Sub-proposal 2 was resolved to build-time prerender via the intent-preservation gate: no design record was cited for the loading/fetch-failure-vs-prerender conflict, so it was surfaced to the maintainer, who chose build-time prerender; the loading-indicator and runtime-fetch-failure states are reclassified as runtime-hydration-only and non-load-bearing in phase 1, parse/transform/malformed-data rejection is specified at build time, and the two affected scenarios plus the malformed-at-load scenario were reworded to assert only reachable behavior. (3) Open (a)/(b) choices resolved: authoring shape = predecessor's; sanitization = preserve owner HTML with a forward guard; date separator = predecessor's non-breaking-space-and-hyphen. (4) Section-slug derivation, deferred skills/relationships/metadata collections, markdown feature parity, and the search substring-floor were added as MUST clauses each paired with a Given/When/Then scenario.

## Resulting Changes

- spec.md
- contracts.md
- constraints.md
- scenarios.md
