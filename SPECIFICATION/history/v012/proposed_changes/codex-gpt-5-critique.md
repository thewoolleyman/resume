---
topic: codex-gpt-5-critique
author: codex-gpt-5
created_at: 2026-07-06T17:34:49Z
---

## Proposal: Pin the discipline inventory artifact

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The v011 non-functional spec requires a local discipline-adoption inventory, but it does not name the file path, required record shape, minimum seed-derived checklist, or update trigger for that inventory. As written, contributors can satisfy the words by keeping an informal or partial inventory, leaving the original seed's 'all applicable livespec fleet discipline' requirement undefined at the point where it should become enforceable.

### Motivation

This is an ambiguity because the spec says the inventory MUST exist while remaining silent about where it lives, what entries it must contain, and how `bun run check` determines the inventory is complete for the seed's discipline list.

### Proposed Changes

Update `Discipline adoption inventory` to name a committed artifact such as `.ai/discipline-adoption.md` or `docs/discipline-adoption.md`, define a required table/schema, and require baseline rows for every seed-listed discipline: TDD, livespec-dev-tooling-inspired shared guidelines, applicable ecosystem tooling, GitHub CI/PR discipline, release discipline, top-of-pyramid E2E discipline, linting, fuzzing/property checks, local memory guardrails, standalone dependency boundaries, Bun/Vitest/Playwright/Svelte/SvelteKit/Vercel toolchain, and git-jsonl work-item workflow. The aggregate check MUST verify the artifact exists, contains those baseline rows, and that adopted/adapted rows cite existing local commands, workflows, hooks, or docs.

## Proposal: Require E2E coverage for every functional scenario

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/scenarios.md

### Summary

The seed explicitly says top-of-pyramid discipline should ensure all scenarios have an E2E test, but v011 still allows integration tests to satisfy a load-bearing scenario when a mapping documents an exception. That weakens the seed's all-scenarios-E2E instruction and leaves it unclear which `SPECIFICATION/scenarios.md` scenarios are allowed to avoid a Playwright-level check.

### Motivation

This is inconsistent with the seed wording: the current spec's integration-test exception creates ambiguity around whether browser-visible acceptance scenarios need a Playwright test or merely any mapped test identifier.

### Proposed Changes

Revise `Top-of-pyramid discipline` so every load-bearing functional scenario in `SPECIFICATION/scenarios.md` MUST have a Playwright end-to-end mapping unless the scenario is explicitly marked later-phase/non-load-bearing. Integration or unit tests MAY be additional supporting evidence, but MUST NOT replace the E2E mapping for a functional scenario. If the project wants a rare exception, require a proposed change that marks the scenario as not browser-exercisable and names the replacement top-level test category.

## Proposal: Define the GitHub CI workflow contract

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The non-functional spec says GitHub CI must run the aggregate check and pull requests should validate the Vercel build path, but it does not name the required workflow files, triggers, jobs, status checks, or branch-protection check names. This leaves the GitHub CI and PR discipline from the seed under-specified even though the auto-merge workflow is described in detail.

### Motivation

This is undefined enforcement: without a required workflow contract, contributors cannot tell which GitHub checks must exist before the repository may claim CI/PR discipline is implemented.

### Proposed Changes

Add a GitHub CI workflow contract requiring committed workflows such as `.github/workflows/check.yml` and, when preview validation is local to GitHub, `.github/workflows/preview.yml` or a documented Vercel GitHub integration status. Specify required triggers (`pull_request` and relevant `push` branches), required jobs (`bun run check`, SvelteKit/Vercel build, Playwright dependencies/cache setup), required status-check names for branch protection, and the rule that branch protection MUST require those exact checks before the PR auto-merge path is claimed operational.

## Proposal: Make TypeScript strictness concrete

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The TypeScript quality gate requires strict mode, Svelte-aware linting, and `svelte-check`, but it does not specify the TypeScript/Svelte configuration floor that turns 'strict' into reproducible enforcement. Important TS/Svelte best-practice dials such as `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, generated SvelteKit type checks, and test/build config separation remain optional by omission.

### Motivation

This is unclear for the requested TypeScript/Svelte environment because the seed asks for TS/JS best practices, while the current spec allows a minimal `strict: true` setup that may miss common unsafe data-shape failures in this resume app.

### Proposed Changes

Extend `TypeScript quality gates` with a required configuration baseline: `strict: true`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, generated SvelteKit `$types` checking via `svelte-check`, separate test-only type allowances from production config, and documented exceptions when a flag cannot be enabled. Require `bun run check` to fail if the committed TypeScript/Svelte config drops below that baseline.

## Proposal: Specify mandatory property-test targets

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/contracts.md
- SPECIFICATION/spec.md

### Summary

The fuzzing section requires property-based or fuzz-style tests when an input space is broader than a few examples, but it does not enumerate the mandatory targets already known from the product spec: YAML source loading, section/item slugging, markdown-to-text search projection, date rendering/sorting, filter/search/sort composition, Result/DomainError mapping, and future AI/MCP contract shaping. The 'broader than a few fixed examples' threshold is too subjective to enforce consistently.

### Motivation

This is ambiguous because implementers can reasonably disagree about which modules cross the threshold, leaving the seed's explicit fuzzing requirement under-enforced for the highest-risk TypeScript data and UI-state logic.

### Proposed Changes

Replace or augment the threshold language with a mandatory property-test target list for phase 1: governed YAML parse/transform rejection, stable item and section slug derivation including collision suffixes, markdown/HTML syntax stripping for search, date parse/render/sort edge cases, deterministic search/filter/sort composition, and visitor-safe error mapping from `DomainError`. Later AI/MCP activation MUST add property tests for grounding/citation and contract shaping before those surfaces become load-bearing.

## Proposal: Define local memory prohibited patterns

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- AGENTS.md

### Summary

The local memory guardrail says checks must fail on prohibited private-memory or hidden tool-state patterns, but the prohibited pattern list is not defined in the spec or AGENTS index. That makes the seed's 'force to .ai/*.md referenced from AGENTS.md' rule dependent on unstated reviewer judgment.

### Motivation

This is undefined guardrail behavior: without an allowlist/prohibit-list distinction, contributors cannot know whether files such as `.claude/`, `.codex/`, `.cursor/`, `.continue/`, tool caches, chat transcripts, or generated memory files should fail the check.

### Proposed Changes

Add a local memory pattern contract. It SHOULD define allowed agent notes as `.ai/*.md` only, require root `AGENTS.md` to list every allowed note, and define prohibited committed paths or globs for private memory/tool state such as `.claude/**`, `.codex/**`, `.cursor/**`, `.continue/**`, `.aider*`, hidden memory databases, chat transcripts, and tool cache directories unless a path is explicitly documented as ordinary project configuration. The aggregate check or hook MUST enforce this list deterministically.
