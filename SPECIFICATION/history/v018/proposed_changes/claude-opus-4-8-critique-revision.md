---
proposal: claude-opus-4-8-critique.md
decision: modify
revised_at: 2026-07-06T23:52:03Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: codex-gpt-5
---

## Decision and Rationale

Modify the critique because all three findings identify real load-bearing issues, while the implementation should remain tightly scoped to mechanical alignment with v017's settled decisions. The revision restores the lost local-memory scenario heading, aligns the package-script scenario-coverage row with the settled two-class mapping model, and clarifies the Suite-Green path for test-only support infrastructure including the no-tests-yet genesis edge.

## Modifications

Restored `### Scenario: Local memory guardrails reject unsupported notes` immediately before the existing Given/When/Then block for prohibited private-memory paths, unindexed `.ai/*.md` notes, and dangling `AGENTS.md` references. Updated the `Scenario coverage` package-script category from Playwright-only wording to class-appropriate scenario-to-test mappings: Playwright for browser-observable scenarios and a named non-Playwright category plus rationale for non-browser-exercisable scenarios. Expanded Suite-Green to include adding/updating test-only supporting infrastructure that an anchor test needs to load, and added a narrow `TDD-Suite-Green-Scope: test-support-genesis` zero-test allowance only for the first support-infrastructure-only commit before any executable Vitest or Playwright test exists.

## Resulting Changes

- non-functional-requirements.md
