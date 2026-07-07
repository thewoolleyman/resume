---
topic: codex-gpt-5-critique
author: codex-gpt-5
created_at: 2026-07-07T04:57:37Z
---

## Proposal: Item anchor composition is underdefined

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

`spec.md` requires phase-1 item identifiers to be derived from the section display name and item display name, and `contracts.md` makes those identifiers public item anchors, but the functional/product spec never defines the exact composition step before slugification. It is unclear whether an item anchor is produced by slugifying the two labels separately, concatenating them with a delimiter, concatenating raw labels before slugification, using the section's disambiguated slug, or some other equivalent-looking variant.

### Motivation

This is a load-bearing ambiguity in the public deep-link contract, not a style issue. The v006 design record says item IDs should be deterministic section-plus-item-name slugs, and this finding does not reverse that settled direction; it identifies that the exact deterministic composition is still undefined. Two implementations can preserve the same section names, item names, slug character rules, and collision suffix rules while producing incompatible public anchors for every item, causing Contents/deep-link tests and future API/MCP references to disagree.

### Proposed Changes

Update `spec.md` §"Stable item identifiers" to define the exact item-id composition before slugification. The edit MUST choose one deterministic algorithm, for example deriving the section slug and item-title slug separately and joining them with a specified delimiter before applying item-level collision suffixes, or another equally explicit algorithm. It MUST state whether section slug collision suffixes participate in the item id, where the item-level `-2`/`-3` suffix is appended, and provide at least one worked example using a real production section and item title. Update `contracts.md` §"Resume data contract" and the stable-item-anchor scenario in `scenarios.md` so the public item anchor format and its tests reference the chosen composition rather than only saying 'section display name and item display name'.

## Proposal: Present end-date rendering is implicit

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

`contracts.md` §"Item rendering" pins the `M.YYYY` date format, the start/end separator after a present start date, and special cases for missing start or missing end dates, but it never explicitly says that a present `end` value renders as its own `M.YYYY` value in the end position. The matching scenario likewise checks the separator and missing-date words but not the normal present-end rendering.

### Motivation

This is an ambiguity in ordinary, load-bearing predecessor-parity behavior. The v008 date-rendering decision pinned the predecessor separator and both-missing precedence, but normal items with both `start` and `end` dates are common resume facts; leaving the present-end output implicit lets one implementation render `7.2001&nbsp;-8.2001`, another render only `7.2001&nbsp;-`, and another treat the end as presentation-only while all claim to follow the current words. The concrete failure is visible date-column divergence and weak scenario coverage for the most common completed-role date shape.

### Proposed Changes

Update `contracts.md` §"Item rendering" to enumerate all four start/end combinations explicitly: present start plus present end renders the start as `M.YYYY`, the predecessor separator, and the end as `M.YYYY`; present start plus missing end renders the start, separator, and `current` in the end position; missing start plus present end renders `until` in the start position, the separator if applicable, and the end as `M.YYYY`; missing start plus missing end renders nothing in the start position and `current` in the end position. Update `scenarios.md` §"Scenario: Item dates render in predecessor format" to assert a concrete present-start/present-end example, such as `7.2001&nbsp;-8.2001`, along with the existing missing-date cases.
