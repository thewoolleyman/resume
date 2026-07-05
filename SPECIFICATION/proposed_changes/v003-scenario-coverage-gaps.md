---
topic: v003-scenario-coverage-gaps
author: claude-opus-4-8
created_at: 2026-07-05T00:23:15Z
---

## Proposal: Add a browser-metadata parity scenario

### Target specification files

- SPECIFICATION/scenarios.md

### Summary

Add a Gherkin acceptance scenario exercising the browser-metadata parity requirements so the observable outputs the constraints.md clause mandates are covered by scenarios.md, satisfying the behavior-implies-scenario discipline.

### Motivation

Routed from a /livespec:doctor v003 since-version delta finding (doctor-llm-objective-delta-uncovered-behavior at constraints.md:23). The §"Browser metadata parity" clause added in v003 states observable outputs (page title `Chad Woolley - Resume`, viewport metadata, favicon/app icons or documented replacements, robots/canonical behavior, no-horizontal-scroll responsive behavior) as MUST, but no ## Scenario exercises them. The user chose the propose-change disposition for this finding.

### Proposed Changes

Add the following acceptance scenario to `SPECIFICATION/scenarios.md`, co-located with the other interactive/static rendering scenarios. It exercises the observable outputs the `constraints.md` §"Browser metadata parity" clause already requires as MUST (page title, viewport, favicon/icons, robots/canonical, no-horizontal-scroll):

## Scenario: Surfaces expose predecessor browser metadata

Given the interactive and static resume surfaces have rendered

When a visitor or crawler inspects the page metadata

Then the page title is `Chad Woolley - Resume`, viewport metadata is present, favicon and app icons (or their documented replacements) are served, robots and canonical behavior is consistent with the preview-non-index rule, and the layout has no horizontal scroll on supported viewports

## Proposal: Add scenarios for defensive interactive-input invariants

### Target specification files

- SPECIFICATION/scenarios.md

### Summary

Add two Gherkin acceptance scenarios covering the invalid-legacy-skill-level and invalid-sort-input invariants so these error-path behaviors already stated as clauses in contracts.md are covered by scenarios.md, satisfying the behavior-implies-scenario discipline.

### Motivation

Routed from a /livespec:doctor v003 subjective behavior-coverage finding (doctor-llm-subjective-behavior-coverage at contracts.md:79 and contracts.md:83). Two edge-case invariants in §"Interactive rendering contract" are stated as clauses but have no scenarios: an item with an invalid legacy skill level SHOULD remain visible with an implementation-visible diagnostic; invalid sort input MUST fall back to default order or be rejected before it mutates state. The user chose the propose-change disposition for this finding.

### Proposed Changes

Add the following two acceptance scenarios to `SPECIFICATION/scenarios.md`, co-located with the other interactive rendering scenarios. They exercise the two defensive edge-case invariants already stated as clauses in `contracts.md` §"Interactive rendering contract" (invalid legacy skill level stays visible with a diagnostic; invalid sort input falls back to default without corrupting state):

## Scenario: Item with an invalid legacy skill level stays visible

Given a resume item carries a skill level that is not one of the defined levels

When the resume renders and skill-level filtering is applied

Then the item remains visible and the app exposes an implementation-visible diagnostic rather than silently dropping the item

## Scenario: Invalid sort input falls back to default order

Given a section receives an invalid sort selection

When the section attempts to apply that sort

Then the section falls back to canonical default order or rejects the input before it mutates sort state, without corrupting the rendered order
