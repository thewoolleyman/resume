---
topic: codex-gpt-5-critique
author: codex-gpt-5
created_at: 2026-07-06T10:31:31Z
---

## Proposal: Inventory fleet discipline before claiming adoption

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/constraints.md

### Summary

The seed asks the project to adopt all applicable livespec fleet and livespec-dev-tooling discipline while remaining standalone, but the current non-functional spec only says the workflow MAY borrow practices and names selected examples. That leaves it silent on how contributors decide which fleet practices are applicable, which ones are intentionally rejected, and how each accepted practice is re-expressed as TypeScript/Bun/Svelte/Vercel-local enforcement.

### Motivation

This is an ambiguity because the seed's strongest instruction is a completeness requirement for discipline adoption, while the current spec has no inventory, traceability, or acceptance rule proving that the applicable ecosystem discipline was considered and locally translated instead of selectively remembered.

### Proposed Changes

Add a requirement that the non-functional spec MUST maintain a local discipline-adoption inventory before implementation planning begins. The inventory MUST enumerate the applicable livespec fleet/livespec-dev-tooling practices considered, classify each as adopted, locally adapted, deferred, or rejected, and cite the local TypeScript/Svelte/Bun/Vercel mechanism that enforces each adopted practice. The requirement MUST also restate that every adopted practice remains standalone: runtime code, tests, CI, hooks, and deployment MUST NOT require sibling checkouts or Python-only fleet tooling. The aggregate check SHOULD fail if the inventory exists but references missing local commands, hooks, or documentation.

## Proposal: Make the Svelte TypeScript gate explicit

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The current contributor toolchain names TypeScript, Bun, Vitest, Playwright, and Vercel, but it does not specify the Svelte/SvelteKit-specific checks that make those tools enforce the actual environment. As written, an implementation could satisfy `bun run check` with generic TypeScript and test commands while skipping `svelte-check`, Svelte compiler diagnostics, Svelte ESLint/a11y rules, or the SvelteKit Vercel-adapter build path.

### Motivation

This is unclear for a TypeScript and Svelte project because the seed explicitly asked the livespec discipline to be translated into the TS/JS ecosystem, but the non-functional contract does not define the Svelte-native quality gates that must be present in the aggregate check.

### Proposed Changes

Extend `Contributor toolchain`, `Aggregate command`, and `TypeScript quality gates` so `bun run check` MUST include Svelte/SvelteKit-native validation: strict TypeScript, `svelte-check` or its documented equivalent, Svelte-aware linting including accessibility diagnostics, format checks, Vitest unit/integration tests, Playwright browser scenarios, and the SvelteKit production build using the Vercel adapter. The spec SHOULD require that any substitute command be documented by name and prove equivalent coverage before it can replace those checks.

## Proposal: Turn coverage and fuzzing expectations into gates

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The seed explicitly lists linting and fuzzing among the high-discipline requirements, but the current spec says coverage thresholds SHOULD be explicit and pure modules SHOULD have property-based or fuzz-style tests. Those recommendations are not tied to `bun run check`, so the spec is silent on when the project must actually enforce coverage and fuzzing for parsing, normalization, search, citation, grounding, and MCP contract logic.

### Motivation

This is an inconsistency between the seed's 'all discipline dials turned up to 11' intent and the current non-functional language, which makes core quality requirements optional or timing-ambiguous instead of enforceable for the TypeScript implementation.

### Proposed Changes

Change the coverage and fuzzing sections to require enforceable local gates. Before the first non-trivial implementation merge, `bun run check` MUST enforce documented line, branch, and function coverage thresholds for first-party logic, with stricter thresholds for data transforms, markdown/search projections, grounding, and MCP contract modules. The same aggregate check MUST run deterministic property-based or fuzz-style tests for parser/normalizer/search/filter/citation/grounding modules whose input space is broader than fixed examples, using a Bun/Vitest-compatible library and no network access. Any intentional exemption MUST be documented next to the module or in the non-functional requirements with a rationale.

## Proposal: Define scenario-to-test enforcement precisely

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/scenarios.md

### Summary

The seed calls for top-of-pyramid discipline ensuring all scenarios have an E2E test, while the current spec allows each scenario to be mapped to an end-to-end or integration test and does not define a manifest, naming convention, or verification command. That makes the coverage gate ambiguous and allows browser acceptance behavior to be claimed complete without a Playwright-level test unless contributors infer stricter rules elsewhere.

### Motivation

This ambiguity matters because scenario coverage is the main bridge between livespec acceptance text and implementation readiness; without a mechanical mapping rule, the project cannot tell whether every scenario heading is enforced or merely described.

### Proposed Changes

Add a scenario coverage contract requiring a repository-local mapping from each load-bearing `SPECIFICATION/scenarios.md` scenario heading to one or more test IDs. Product/browser scenarios MUST default to Playwright end-to-end coverage. Integration tests MAY satisfy a scenario only when the scenario is explicitly non-browser, when the E2E surface would be redundant with a separately mapped Playwright scenario, or when a documented exception explains why integration coverage is the correct top-level test. `bun run check` MUST verify that every load-bearing scenario has a mapping, every mapped test exists, later-phase scenarios are excluded until activated, and stale mappings fail the check.

## Proposal: Specify release and promotion discipline

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/contracts.md

### Summary

The seed explicitly lists release discipline and the project targets Vercel production, preview, and development environments, but the current non-functional spec only says release or production-promotion workflows must be explicit and not rely on undocumented local state. It does not define what a compliant release is, which checks gate production promotion, how previews are verified, or how rollback and environment configuration are documented.

### Motivation

This is undefined release discipline: contributors can agree that releases must be 'explicit' while disagreeing on whether conventional commits, preview verification, Vercel production promotion, rollback notes, or environment-variable review are required before production changes ship.

### Proposed Changes

Add a release-discipline section for this Vercel app. It MUST define the sanctioned release paths for direct owner commits and pull-request merges; require Conventional Commit subjects for commits that land on `master`; require the aggregate check, SvelteKit production build, and Vercel preview validation before production promotion; document how production deployment is triggered; require environment-variable changes to be reviewed against the environment contract; and require rollback or revert instructions for production-impacting changes. If semantic versioning or changelog generation is intentionally out of scope for a personal resume app, the spec MUST say so explicitly.

## Proposal: Make local memory guardrails enforceable

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- AGENTS.md

### Summary

The seed requires hooks to guard against persisting local memories and to force any agent-facing notes into `.ai/*.md` referenced from `AGENTS.md`, but the current non-functional spec says hooks or checks SHOULD guard once conventions are introduced. The root `AGENTS.md` index exists, yet the enforcement rule remains optional and does not name prohibited locations, required references, or check behavior.

### Motivation

This is an ambiguity in a repository-local privacy and process guardrail: the current text acknowledges the desired convention but leaves it unclear when a committed hidden memory file must fail a hook or aggregate check.

### Proposed Changes

Strengthen `Local memory guardrails` so repository checks MUST prevent committed private local memory in hidden tool-state locations. The spec SHOULD define an allowed path pattern for agent-facing notes, such as `.ai/*.md`, and require each such file to be indexed from `AGENTS.md` with its purpose. The aggregate check or a documented fast hook MUST fail when committed files match prohibited memory/cache patterns, when an `.ai/*.md` file is unindexed, or when `AGENTS.md` references a missing `.ai` note. The rule MUST allow ordinary tool configuration files that are not private memory when explicitly documented.
