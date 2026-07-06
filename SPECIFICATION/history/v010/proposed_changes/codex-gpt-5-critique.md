---
topic: codex-gpt-5-critique
author: codex-gpt-5
created_at: 2026-07-06T08:25:05Z
---

## Proposal: Canonical data source path remains unspecified

### Target specification files

- spec.md
- contracts.md
- constraints.md
- scenarios.md

### Summary

The phase-1 spec repeatedly requires a single canonical governed data source and says the repository MUST document the authoritative source path, but the active functional specification never names the concrete path or filename. `spec.md` requires exactly one version-controlled document and a documented canonical source path, `contracts.md` makes that documented path authoritative for loading, and `scenarios.md` acceptance text refers to importing into the documented source path; however, no functional file currently tells an implementer whether to create something like `src/lib/resume-data.yml`, `data/resume.yml`, or another location.

### Motivation

This is an ambiguity in a load-bearing phase-1 contract: implementation work cannot be fully drive-able from the functional specs if the authoritative resume-data file path is intentionally left to implementer choice while other requirements depend on that path being documented and unique. It also leaves room for competing data files or tests hard-coding one path while the app reads another.

### Proposed Changes

Update the functional specs to name the canonical phase-1 governed data source path and format explicitly. `spec.md` SHOULD replace the generic examples with the chosen path and format, `contracts.md` SHOULD state that the loader reads that path as the single authority, `constraints.md` SHOULD clarify that the committed production snapshot at that path is what the build reads, and `scenarios.md` SHOULD refer to the named path instead of the unresolved phrase "documented source path".

## Proposal: Search worked example is required but not authored

### Target specification files

- contracts.md
- scenarios.md
- spec.md

### Summary

`contracts.md` says the specification MUST carry at least one deterministic worked search example tied to the committed governed dataset: a specific query string, the exact matching item set in canonical order, at least one non-matching item, one word that appears only inside markdown or HTML syntax and MUST NOT match, and one plain-text prose word that MUST match. `scenarios.md` maps acceptance to that worked example, but the active spec tree does not actually provide the concrete query, expected items, or negative syntax-only term.

### Motivation

This is an undefined acceptance anchor, not a style issue. The predecessor implementation's tests covered the markdown-stripping distinction with fixture data, and the current spec correctly asks for an equivalent production-data example; without the concrete example, scenario-to-test mapping for search remains ambiguous and implementers can satisfy the prose with incompatible item sets or search projections.

### Proposed Changes

Add a concrete worked example to `contracts.md` §"Search" or to a clearly referenced companion section tied to the committed production dataset. It MUST name the query string, list the exact expected matching item titles in canonical order, state at least one item that MUST NOT match, and include the markdown/HTML syntax-only term that MUST NOT match plus the plain-text prose term that MUST match. Update `scenarios.md` only if needed so the search worked-example scenario points at the exact authored example.
