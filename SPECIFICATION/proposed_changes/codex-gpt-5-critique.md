---
topic: codex-gpt-5-critique
author: codex-gpt-5
created_at: 2026-07-06T20:10:52Z
---

## Proposal: Package script surface remains optional despite being the enforcement backbone

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The non-functional requirements say the repository SHOULD provide command categories, while later requirements depend on concrete commands such as bootstrap, check, tdd-commit, lint, typecheck, build, coverage/property checks, and scenario coverage. That leaves the seed's TypeScript/Svelte/Bun discipline ambiguous: the spec requires many gates, but the command surface that makes those gates reproducible in a fresh checkout is optional and unnamed.

### Motivation

This is an inconsistency between the seed's 'all discipline dials turned up to 11' instruction and the current command contract. A contributor can satisfy `bun run check` while omitting a bootstrap command that installs hooks, omitting the required `tdd-commit` helper from package scripts, or using undocumented subcommands that CI invokes indirectly; the spec is silent on exact script names and on an aggregate check that proves the package script surface exists.

### Proposed Changes

Change `SPECIFICATION/non-functional-requirements.md` §"Package script categories" from SHOULD to MUST before the first non-trivial implementation merge. Name the required Bun script surface explicitly, including at minimum `check`, `bootstrap`, `dev`, `build`, `typecheck`, `lint`, `format:check`, `test:unit`, `test:e2e`, `test:coverage`, `test:property`, `check:scenarios`, `check:result`, `check:memory`, and `tdd-commit` or documented stricter equivalents. Require `bun run check` to verify that the required scripts exist, that hooks are installed by the bootstrap script, and that CI delegates to the same script names instead of embedding divergent commands.

## Proposal: Red-green protocol is not adapted to multi-file TypeScript and Svelte tests

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The Red -> Green protocol requires 'the test file' to be staged alone and checksummed, and also requires every source file to have a paired test at its mirror path, but TypeScript/Svelte/Playwright tests often require multiple committed artifacts: page objects, fixtures, component harnesses, snapshots, route data, helper modules, and generated type surfaces. The current text is ambiguous about whether those supporting test artifacts are allowed in the Red leg and what 'mirror path' means for Svelte routes, components, stores, server modules, and data loaders.

### Motivation

This ambiguity can make the TDD gate either impossible to satisfy for realistic Svelte changes or easy to bypass by hiding meaningful test logic in untracked helper files outside the single checksummed test path. The seed requires the livespec TDD discipline to be adapted to the TypeScript/Svelte environment, but the current adaptation still models tests as one file rather than a typed test artifact set with a defined source-to-test mapping.

### Proposed Changes

Revise §"Mechanically enforced Red -> Green commit protocol" to define a Red-leg test artifact set instead of a single test file. The spec MUST allow and checksum all staged test-only files needed to execute the Red test, classify allowed test artifact paths for Vitest, Playwright, Svelte component tests, fixtures, and snapshots, and forbid production-source changes in the Red leg. Define the source-to-test mapping table for `src/lib`, `src/routes`, Svelte components, server/load modules, data fixtures, and scripts, including when a Playwright scenario mapping satisfies the pair. The Green leg MUST verify that every Red-leg test artifact is byte-identical unless a new Red leg is recorded.

## Proposal: Lint baseline says MUST be pinned but only SHOULD use the concrete TypeScript/Svelte stack

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The TypeScript quality section says the lint and format baseline MUST be pinned concretely enough to enforce, but the actual baseline stack is phrased as SHOULD: type-aware `typescript-eslint`, Svelte accessibility rules, Prettier, zero warnings, import boundaries, and Bun dependency hygiene. This weakens the seed's strict TypeScript/Svelte discipline into an optional recommendation.

### Motivation

This is an internal inconsistency and enforcement ambiguity. If the concrete baseline is only SHOULD, an implementation can choose a much thinner lint stack, document a vague substitute, and still claim compliance, even though the seed asked for TypeScript/Svelte best-practice discipline and linting with the dials turned up to 11.

### Proposed Changes

Change the concrete lint/format baseline from SHOULD to MUST, while retaining a narrow substitute path only for documented stricter equivalents. Require type-aware `typescript-eslint` strict-type-checked rules, Svelte-aware linting with accessibility diagnostics enabled, Prettier or an explicitly stricter formatter, zero warnings in CI, import-order and first-party boundary rules, dependency hygiene checks appropriate to Bun, and an aggregate-check assertion that the committed config enables these rule families. Any exception MUST name the affected rule family, why the stricter equivalent is acceptable, and when the exception is revisited.

## Proposal: GitHub pull-request discipline can remain unprovisioned indefinitely

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The seed calls out GitHub CI workflow and pull-request discipline, but the current non-functional requirements make key parts conditional: branch protection SHOULD be configured, auto-enable-merge is required only 'when provisioned', and repository-local verification is only SHOULD when the automated path is claimed operational. This leaves no deadline by which PR discipline becomes enforced for this TypeScript/Svelte app.

### Motivation

This is an ambiguity in adoption state. The discipline inventory can list GitHub CI and pull-request discipline as adopted while the branch protection, auto-merge workflow, and settings verification remain optional or merely future-conditional. That contradicts the seed's request to specify and enforce the discipline rather than leave it as an aspirational workflow.

### Proposed Changes

Strengthen §"GitHub CI and pull request discipline" and §"Pull request landing automation" so the PR path is either explicitly deferred in the discipline inventory with a revisit condition, or fully gate-enforced before the first non-trivial implementation merge. If adopted, branch protection for `master` MUST require the aggregate check, apply to administrators, require linear history, and disable strict up-to-date branch merging; `.github/workflows/auto-enable-merge.yml` MUST exist; merge-method settings MUST be documented; and `bun run check` SHOULD include repository-local verification of the committed workflow/settings documentation, with optional live `gh` verification when credentials are available.

## Proposal: Property and fuzz checks lack reproducibility rules for TypeScript generators

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The fuzzing/property section requires deterministic property-based or fuzz-style tests, but it does not specify the TypeScript generator tool, seed handling, replay behavior, minimum run counts, shrink-output capture, or how malformed/adversarial cases are guaranteed to be included. The aggregate check can therefore run a nominal property test without preserving the reproducibility needed for a high-discipline gate.

### Motivation

This leaves the seed's fuzzing dial under-specified for the TypeScript/Svelte environment. Without seed and replay requirements, a CI-only failure may be hard to reproduce locally; without generator classification requirements, the malformed/adversarial portion can silently collapse into happy-path property tests while still claiming compliance.

### Proposed Changes

Extend §"Fuzzing and property checks" with a concrete TypeScript reproducibility contract. The spec SHOULD require `fast-check` or a documented stricter Bun/Vitest-compatible equivalent, fixed or logged seeds for CI, a local replay command for failed seeds, committed minimum run counts for fast local and CI modes, shrink output capture in failure logs, and generator suites that explicitly classify valid-domain, malformed, adversarial, boundary, and legacy-compatibility cases for each required target. `bun run check` MUST fail when required generator categories or replay metadata are absent.
