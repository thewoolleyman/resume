---
topic: injectable-mocks-unit-coverage
author: claude-opus-4-8
created_at: 2026-07-08T22:17:24Z
---

## Proposal: Test-only injection seams and mocks are a legitimate, expected means to 100% coverage at the bottom of the pyramid

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

Ratify the repository owner's decision (2026-07-09) that, at the unit /
bottom-of-pyramid level, dependency injection and mocking — including injection
seams (props, parameters, injected collaborators, or module mocks) whose
non-default values are exercised ONLY by tests — are a fully acceptable and
expected means of reaching the non-negotiable 100% line/branch coverage floor,
and MUST NOT be rejected as "coverage-only" or "fake" behavior. This includes
covering otherwise-unreachable branches such as framework-compiler-generated
branches (e.g. Svelte's reactive-update / keyed-`{#each}` branches over static
data) by mocking or injecting the inputs that drive them. §"Test coverage
expectations" already states that "dependency injection and module mocking used
to inject whatever inputs a branch requires, can always reach 100% line and
branch coverage"; this change makes explicit that a test-only injection seam is
a legitimate realization of that principle and is not disqualified for existing
to enable coverage.

### Motivation

During the phase-1 MVP implementation, a live reviewer rejected an injectable
prop added to a Svelte component to cover an otherwise-unreachable
compiler-generated branch, calling it "coverage-only fake API." That rejection
was **incorrect** and contradicts the existing §"Test coverage expectations"
clause, which explicitly sanctions dependency injection and module mocking to
reach the 100% floor. The owner has ruled that any mock/DI behavior may be used
at the bottom of the test pyramid to achieve full coverage. Recording this
guidance persistently prevents a recurrence and keeps the 100% floor
non-negotiable without pushing implementers toward weakening the gate or
contorting production structure. It changes only the non-functional testing
discipline; no product behavior, contract, or scenario changes.

### Proposed Changes

In non-functional-requirements.md §"Test coverage expectations", after the
existing sentence that ends "...can always reach 100% line and branch coverage,
so there is no lower coverage tier, no framework-glue exemption, and no
per-module coverage carve-out.", ADD:

> Dependency injection and mocking are first-class tools for this floor: at the
> unit / bottom-of-pyramid level, an injection seam or mock (a prop, parameter,
> injected collaborator, or module mock) whose non-default value is exercised
> only by tests is a legitimate, expected means of reaching 100% coverage and
> MUST NOT be rejected as "coverage-only" or "fake" behavior. This explicitly
> includes driving otherwise-unreachable branches — including
> framework-compiler-generated branches (for example a UI framework's
> reactive-update or list-reconciliation branches over data that never changes
> in production) — by injecting or mocking the inputs those branches require. A
> reviewer MUST NOT require weakening the 100% floor, adding a coverage waiver,
> or contorting production structure when an injection seam or mock at the
> bottom of the pyramid would cover the branch instead.
