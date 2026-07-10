---
proposal: comment-discipline.md
decision: accept
revised_at: 2026-07-10T10:53:37Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Accept: add §"Comment discipline" under non-functional-requirements.md
§"Constraints" and a corresponding scenario. The maintainer directs
adopting the livespec fleet's ban on rotting provenance-breadcrumb
comments in committed source. The resolution MIRRORS livespec's own
§"Comment discipline" (Rule 1 WHY-not-WHAT judgment-based; Rule 2
no-historical-bookkeeping-references mechanized) and adapts it to this
repository's standalone TypeScript toolchain, so it introduces a new
additive process constraint rather than departing from any ratified
record — the intent-preservation gate needs no departure
acknowledgment. Two adaptations are recorded as deliberate: (1) the
mechanical banned set is extended beyond livespec's enumerated markers
to this repo's breadcrumb forms (work-item/ledger ids, planning-thread
paths, design-document slice references, commit SHAs, PR numbers) so the
maintainer's "no references to them" directive is enforceable rather
than judgment-only; (2) durable present-tense pointers to the living
specification (`<file>.md §"<Section>"`) remain explicitly permitted,
matching livespec's asymmetry that spec-section cross-references are
acceptable. Enforcement is a standalone `bun run check` gate
(comment/docstring-only scan; string literals and exempt trees
untouched), consistent with `constraints.md` §"Standalone boundary" and
this repo's gate-enforced discipline. The gate is implementation work
that follows this revision.

## Resulting Changes

- non-functional-requirements.md
