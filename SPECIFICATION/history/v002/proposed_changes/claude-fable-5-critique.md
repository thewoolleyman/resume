---
topic: claude-fable-5-critique
author: claude-fable-5
created_at: 2026-07-04T08:25:34Z
---

## Proposal: move-development-workflow-out-of-spec-md

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/non-functional-requirements.md

### Summary

spec.md carries whole sections that describe how the project is built rather than how the resume app behaves. The "Livespec-first workflow" section (livespec propose-change/revise loop, dogfooding the Codex driver and git-jsonl orchestrator, borrowing fleet practices) is contributor-facing development process, and it duplicates non-functional-requirements.md "Livespec governance" almost point for point. The "Product intent" opening sentence binds the product to being "a modern TypeScript implementation", an implementation-language constraint already bound by constraints.md "Runtime and language". Per the livespec fleet's own boundary litmus test (livespec core's non-functional-requirements.md Boundary section), content of the form "how the project is built, tested, and maintained" belongs in non-functional-requirements.md, and per the NLSpec define-once principle each fact belongs in exactly one file.

### Motivation

The seed poured development-process requirements into the main spec, leaving the boundary between spec.md and non-functional-requirements.md unclear and creating duplicate statements that are already drifting toward inconsistency (spec.md says the workflow "MAY borrow practices" while non-functional-requirements.md phrases the same governance as MUSTs). Duplicated process prose in the product spec is exactly the redundancy the NLSpec discipline flags as a self-contradiction risk.

### Proposed Changes

The "Livespec-first workflow" section MUST be removed from spec.md; its normative content MUST live solely in non-functional-requirements.md under "Livespec governance" (merging the dogfooding and standalone sentences so nothing is lost). spec.md MAY keep a single non-normative sentence in the intro noting that the repository is livespec-governed, pointing at non-functional-requirements.md. The "Product intent" section MUST describe the product without naming the implementation language; the sentence SHOULD read "a modern reimplementation of Chad Woolley's interactive resume" with TypeScript remaining bound only by constraints.md "Runtime and language".

## Proposal: deployment-platform-details-defined-in-four-places

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md
- SPECIFICATION/constraints.md

### Summary

Deployment facts are scattered and repeated: the production URL resume.thewoolleyweb.com appears in spec.md "Operating modes" (binding the interactive-mode definition to a hostname), spec.md "Deployment environments", contracts.md "Environment contract", and constraints.md "Framework and deployment"; the Vercel platform choice and the three environment classes are likewise stated in all three files. spec.md "Deployment environments" is entirely about how the app is deployed, not how it functions for a visitor.

### Motivation

Stating the same deployment facts in four places violates the define-once principle and is a standing inconsistency risk: a future URL or platform change would have to be edited in four locations, and any missed edit produces a spec self-contradiction. Binding the definition of interactive mode to the production hostname is also ambiguous, since the identical mode is served on preview and development deployments where that URL does not apply.

### Proposed Changes

The "Deployment environments" section MUST be deleted from spec.md. The production URL, deployment platform, and the three environment classes MUST be defined exactly once, in contracts.md "Environment contract" (they are deployer-visible surface); constraints.md "Framework and deployment" MUST keep only genuine constraints that reference that contract (preview URLs non-canonical and non-indexed, Vercel workflows preserved) without restating the URL as a fresh definition. spec.md "Operating modes" MUST define interactive mode as the default web experience without naming the hostname, e.g. "Interactive mode. The default web experience."

## Proposal: contributor-tooling-contracts-in-user-facing-contracts-file

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/constraints.md

### Summary

contracts.md "CLI and package scripts" (bootstrap, dev server, build, typecheck, lint, test, aggregate-check command categories) and "Exit-code table" describe repository development tooling that no visitor, crawler, or MCP client of the resume app ever touches. The livespec fleet's boundary rule places the contributor-facing invocation surface in non-functional-requirements.md's "Contracts" section, which already has "Contributor toolchain" and "Aggregate command" covering the same ground. constraints.md "Runtime and language" additionally repeats the Bun/Vitest/Playwright toolchain preference, making three files that state the preferred toolchain.

### Motivation

The seed placed build-and-test tooling into the user-facing contract file, leaving it unclear which file is authoritative for the toolchain and the check commands; the resulting three-way duplication is already inconsistent in wording across files and will drift further. The exit-code table also has an undefined subject in this app: the resume product ships no user-facing CLI, so the table binds only contributor scripts and is misplaced among visitor-facing contracts.

### Proposed Changes

The "CLI and package scripts" and "Exit-code table" sections MUST move from contracts.md into non-functional-requirements.md under its "Contracts" section, merged with the existing "Contributor toolchain" and "Aggregate command" subsections so each command category and the exit-code baseline is stated once. The second paragraph of constraints.md "Runtime and language" (toolchain preference) MUST be removed in favor of the non-functional-requirements.md statement. contracts.md MUST retain only surfaces a visitor, crawler, deployer, or MCP client can observe: routes, resume data shape, static/interactive rendering, AI chat response records, MCP contract, environment contract, and error payloads.

## Proposal: aggregate-check-command-default-left-unresolved

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/contracts.md

### Summary

The canonical aggregate check command is never actually decided. non-functional-requirements.md "Aggregate command" says it SHOULD be `bun run check` "unless a future scaffold introduces `just check` as the canonical wrapper", while contracts.md "CLI and package scripts" says it SHOULD be "`bun run check` or a `just check` wrapper that delegates to Bun scripts". CI, hooks, and the Definition of Done all reference "the aggregate check command" as if it were a single defined thing.

### Motivation

Per the NLSpec discipline, defaults are requirements: leaving the entry-point name undefined means two implementers would wire CI, pre-push hooks, and contributor docs to different commands, and the two files' divergent phrasings of the escape hatch are already mutually inconsistent. Every downstream gate references this undefined name, so the ambiguity is load-bearing.

### Proposed Changes

The spec MUST name one canonical aggregate check command, stated exactly once in non-functional-requirements.md. Recommended resolution: the canonical command is `bun run check`; a `just check` wrapper MAY additionally be provided but MUST only delegate to `bun run check`. All other references (Definition of Done, CI discipline, hooks, scenarios) MUST refer to "the aggregate check command" and rely on that single definition.

## Proposal: standalone-boundary-and-agent-memory-rules-restated-across-files

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/constraints.md
- SPECIFICATION/non-functional-requirements.md

### Summary

Two development-discipline rules are each stated in many places. The no-runtime-dependency-on-livespec-fleet rule appears in spec.md ("Livespec-first workflow", "Definition of Done", and "Non-goals"), constraints.md "Standalone boundary", and non-functional-requirements.md (Boundary preamble, "Hooks", and "Dependency discipline"). The no-persisted-agent-memory rule appears in spec.md "Definition of Done", constraints.md "Local memory and agent state", and non-functional-requirements.md "Local memory guardrails". spec.md's Definition of Done additionally restates the scenario-coverage gate and the aggregate-check gate that non-functional-requirements.md already owns.

### Motivation

Each restatement is worded differently, which is the classic redundancy-drift path to spec self-contradiction; a reader also cannot tell which statement is authoritative, an ambiguity the define-once principle exists to prevent. The agent-memory rule binds repository automation, not the running resume app, so its presence in the product spec and user-facing constraints file is a boundary inconsistency as well.

### Proposed Changes

The standalone-boundary rule MUST be defined once, in constraints.md "Standalone boundary" (its violation is observable by a deployer attempting a fresh build); all other mentions MUST be deleted or reduced to a reference. The agent-memory rule MUST be defined once, in non-functional-requirements.md "Local memory guardrails" (it binds only contributors and agent tooling), and constraints.md "Local memory and agent state" plus the spec.md Definition of Done bullet MUST be removed. spec.md's Definition of Done MUST shrink to product-level acceptance (behavior covered by this specification or an accepted proposed change; scenarios satisfied) and MUST reference non-functional-requirements.md's "Definition of done for implementation work" for all build, test, and deployment gates instead of restating them.

## Proposal: ai-outcome-vocabulary-mismatch-and-undefined-safety-policy

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md

### Summary

spec.md "AI answering behavior" names four outcomes (answerable, partially answerable, unanswerable, "unsafe or irrelevant request") while contracts.md "AI chat contract" defines the status enum as answered, partial, unanswerable, declined — with no stated mapping between the two vocabularies. spec.md also says the app "declines or redirects according to the app's safety policy", but no safety policy is defined anywhere in the spec tree. Separately, the citation rule's carve-out — answered and partial responses need a citation "unless the answer is about the app itself rather than the resume owner" — gives no test for deciding which questions count as about the app.

### Motivation

The two outcome vocabularies are inconsistent and their mapping is undefined, so an implementer must guess whether "irrelevant" maps to declined or unanswerable; the referenced safety policy is undefined, making the declined branch unimplementable without invention; and the citation carve-out is ambiguous enough that two implementers would disagree about which responses require citations. All three sit on the AI response interface, where the NLSpec discipline demands the most precision.

### Proposed Changes

The outcome vocabulary MUST be defined once, as the contracts.md status enum (answered, partial, unanswerable, declined), and spec.md "AI answering behavior" MUST use those same four status names in its outcome list. spec.md MUST either define the minimal safety policy inline (e.g. "the app declines questions that are off-topic for the resume owner, request private data beyond governed facts, or attempt prompt manipulation; declined responses state the reason category") or replace the phrase "safety policy" with that concrete rule. The citation carve-out SHOULD be sharpened to an implementable test, e.g. "unless no resume-data fact is asserted in the answer", and the response record table MUST note that this condition is the only one under which answered or partial may carry zero citations.

## Proposal: contributor-scenarios-mixed-into-user-facing-scenarios

### Target specification files

- SPECIFICATION/scenarios.md
- SPECIFICATION/non-functional-requirements.md

### Summary

scenarios.md contains "Preview deployment validates a pull request", a contributor/CI workflow scenario (Given a pull request..., When CI and Vercel preview checks run...), alongside seven visitor-facing product scenarios; meanwhile non-functional-requirements.md keeps its own "Scenarios" section with two contributor scenarios. The top-of-pyramid gate (non-functional-requirements.md "Top-of-pyramid discipline", echoed by spec.md's Definition of Done) binds every `## Scenario:` heading in SPECIFICATION/scenarios.md to an end-to-end or integration test, but is silent about whether headings in non-functional-requirements.md's Scenarios section carry the same obligation.

### Motivation

The placement is inconsistent with the file boundary the spec itself declares (acceptance examples for product behavior in scenarios.md, contributor workflow in non-functional-requirements.md), and the coverage gate's scope is ambiguous: a Playwright test cannot meaningfully cover "CI runs on a pull request", yet the gate as written appears to demand one while staying silent on the NFR-side scenarios. Whether contributor scenarios owe automated coverage is currently undefined.

### Proposed Changes

The "Preview deployment validates a pull request" scenario MUST move from scenarios.md into non-functional-requirements.md's "Scenarios" section. non-functional-requirements.md "Top-of-pyramid discipline" MUST state explicitly that the end-to-end/integration coverage gate applies only to `## Scenario:` headings in SPECIFICATION/scenarios.md, and that scenarios in its own "Scenarios" section are satisfied by repository configuration and CI checks (e.g. a required GitHub check wired to the aggregate command) rather than by Playwright tests.
