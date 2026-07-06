---
topic: codex-gpt-5-critique
author: codex-gpt-5
created_at: 2026-07-06T18:43:36Z
---

## Proposal: Applicable livespec ecosystem tooling is still undefined

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The original seed requires adopting all applicable livespec fleet and ecosystem tooling discipline, but `non-functional-requirements.md` only requires a baseline inventory row named `applicable livespec ecosystem tooling` without defining which ecosystem tools are applicable, which are locally adapted, or which are intentionally rejected for the standalone TypeScript/Svelte environment.

### Motivation

This is an ambiguity in the seed-to-spec mapping: unlike the newly enumerated livespec-dev-tooling-inspired guidelines, the broader livespec ecosystem row is silent and therefore unfalsifiable. A contributor can satisfy the inventory shape while omitting applicable livespec practices such as the Codex driver workflow, doctor/static gates, proposed-change/revise lifecycle, git-jsonl work-item routing, or other applicable ecosystem conventions, and the aggregate check has no committed list to compare against.

### Proposed Changes

Add a `Livespec ecosystem tooling adoption` subsection to `SPECIFICATION/non-functional-requirements.md`. It MUST enumerate each seed-relevant ecosystem tool or practice considered for this TypeScript/Svelte app, including at minimum the livespec Codex driver, livespec CLI lifecycle (`seed`, `propose-change`, `critique`, `revise`, `doctor`), static doctor checks, git-jsonl work-item workflow, and any intentionally non-adopted fleet-only Python tooling. For each entry the spec MUST require a disposition, enforcement class, local TypeScript/Svelte/Bun/Vercel realization or explicit standalone-boundary rejection, and an aggregate-check or doctor/static hook where one is required. The discipline inventory MUST cite this enumeration rather than carrying a generic row whose contents are undefined.

## Proposal: Local-memory hook requirement is weaker than the seed

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The seed specifically asks for hooks that guard against persisting local memories and force durable notes into `.ai/*.md` referenced from `AGENTS.md`, but the current spec allows the guardrail to be enforced by either an aggregate check or a documented fast hook and only requires hooks once `.ai` notes or prohibited-memory patterns are introduced.

### Motivation

This is inconsistent with the seed's hook-level requirement and leaves an ambiguous enforcement gap before the first accidental hidden-memory commit. The current text can be satisfied without installing any local commit hook at all, even though the seed calls out hooks as the mechanism that should prevent private local memories from entering commits.

### Proposed Changes

Strengthen `SPECIFICATION/non-functional-requirements.md` so local memory guardrails are both aggregate-enforced and hook-enforced before non-trivial implementation work begins. The spec MUST require a committed, reproducible hook configuration installed by the bootstrap command, and that hook MUST block commits containing prohibited private-memory paths, unindexed `.ai/*.md` files, or missing `.ai` references from `AGENTS.md`. The aggregate check MUST continue to run the same guard so CI catches bypassed hooks. If the project intentionally permits a no-hook bootstrap, the spec MUST record that as a seed deviation and explain the replacement enforcement mechanism.

## Proposal: TypeScript and Svelte linting dial is not pinned enough to be enforceable

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The seed asks for all discipline dials turned up to 11 using TypeScript and Svelte best practices, but the linting and formatting requirements still let the implementation choose an unspecified linting stack as long as it claims to cover broad categories such as unused code, unsafe promises, accidental `any`, import disorder, and Svelte accessibility diagnostics.

### Motivation

This is unclear and under-specified for enforcement: two implementations could both satisfy the prose while choosing very different ESLint/Svelte/format configurations, warning policies, type-aware rule coverage, import-boundary checks, and dependency-quality checks. The aggregate check is required to run linting, but the spec is silent on a concrete TypeScript/Svelte rule baseline that proves the seed's strict linting discipline has actually been adopted.

### Proposed Changes

Pin a minimum TypeScript/Svelte lint and format baseline in `SPECIFICATION/non-functional-requirements.md`. The spec SHOULD require type-aware ESLint using `typescript-eslint` strict type-checked rules or a documented stricter equivalent, Svelte-aware linting with accessibility rules enabled, formatter checking through Prettier or a documented equivalent, zero warnings in CI, import/order or boundary rules for first-party modules, and dependency hygiene checks appropriate to Bun. Any substitute MUST document rule-equivalent coverage, and `bun run check` MUST fail if the committed configuration drops below the baseline.

## Proposal: TDD evidence gate lacks a concrete evidence format and diff base

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The current non-functional requirements say the TDD evidence gate checks the current branch or pull-request diff against `master`, but they do not define the evidence artifact format, its committed location, or how direct-owner commits on `master` establish the relevant changeset before the branch no longer differs from `master`.

### Motivation

This leaves an ambiguity in the enforcement mechanism for the seed's TDD discipline. A pull request can compare against `master`, but the repo explicitly sanctions direct commits to `master`; after such a commit lands, `master..master` is empty, and before it lands there is no named branch requirement. Without a concrete evidence file/trailer schema and diff-base rule, the gate cannot reliably fail changes that lack red-first evidence.

### Proposed Changes

Define a TDD evidence record format and changeset-base rule. The spec MUST name the committed location or accepted PR metadata/trailer shape for evidence records, require fields for work item or behavior, red command/test id, observed red failure, green command, and exemption class, and specify how `bun run check` finds the candidate changeset for both PR branches and direct-owner local commits. For direct commits, the spec SHOULD require the evidence gate to run pre-commit or pre-push against the staged/committed range before the commit is pushed, or require a committed evidence file that remains checkable after landing.
