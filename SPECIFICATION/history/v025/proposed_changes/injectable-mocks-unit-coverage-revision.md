---
proposal: injectable-mocks-unit-coverage.md
decision: accept
revised_at: 2026-07-08T23:40:21Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Ratified maintainer decision (2026-07-09): dependency injection and mocking at the unit / bottom-of-pyramid level — including test-only injection seams that drive framework-compiler-generated branches — are a legitimate, expected means of reaching the non-negotiable 100% line/branch floor and MUST NOT be rejected as "coverage-only" or "fake". This makes the existing §"Test coverage expectations" DI/mocking sanction explicit; it changes only contributor testing discipline (a non-functional concern per the Boundary litmus), introduces no product behavior, and needs no scenario.

## Resulting Changes

- non-functional-requirements.md
