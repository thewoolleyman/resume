---
proposal: coverage-100-and-content-triggered-tdd.md
decision: accept
revised_at: 2026-07-07T03:29:43Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Maintainer-directed reset (thewoolleyman, 2026-07-07) to stop the adversarial loop's repeated thrashing on coverage and TDD. BOTH proposals in this file are accepted. Proposal 1 (coverage): replaces the tiered core/glue coverage-floor apparatus with a single non-negotiable rule — first-party product source under src/** MUST be 100% line and 100% branch coverage — because nothing in well-factored, loosely coupled, highly cohesive product logic is un-coverable at the unit level (dependency injection and module mocking inject whatever a branch needs). Flat 100% is strictly less ambiguous than tiers and removes the entire coverage critique surface. Proposal 2 (TDD): rewrites the Red -> Green protocol as a CONTENT-TRIGGERED gate (leg selected by staged buckets + HEAD trailer state), removing the invented TDD-Intent discriminator, the every-commit-needs-a-marker rule, and the test-support-genesis allowance; the model is stated as standalone spec rules with no reference to any external project. DESIGN-RECORD DEPARTURE (per spec.md Intent preservation and design-record authority): this deliberately reverses two items on the Settled list in plan/adversarial-spec-hardening/research/findings.md — the v017 coverage-floor decision (non-trivial tiered floors; core strictly > glue; tunable percentages) and the v016 TDD leg-selection decision (explicit TDD-Intent marker; 'leg selection is NOT the commit subject prefix'). The maintainer ratified both departures directly. The findings.md Settled list and handoff are being updated in the same landing to record the reversal and to add an anti-thrash rule.

## Resulting Changes

- non-functional-requirements.md
