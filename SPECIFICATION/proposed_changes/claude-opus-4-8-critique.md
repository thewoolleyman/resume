---
topic: claude-opus-4-8-critique
author: claude-opus-4-8
created_at: 2026-07-06T18:09:57Z
---

## Proposal: TDD dial is specified but has no enforcement mechanism, breaking the inventory's own adoption rule

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The seed (archive/livespec-seed.md, item 3) lists TDD first among the disciplines it wants captured with the dials 'turned up to 11', and §'Test-Driven Development discipline' specifies Red -> Green -> Refactor plus preferred red-test types. But no mechanism anywhere in the file enforces the red-first ordering that IS the discipline: §'Definition of done for implementation work' and the §'Aggregate command' gate only prove that tests exist, pass, and meet coverage — none verify that a failing test preceded the implementation. Every other seed discipline in this file cites a concrete bun run check gate; TDD alone cites none. This collides with §'Discipline adoption inventory', which makes TDD a required baseline row and requires every adopted or locally adapted row to cite a mechanism that 'enforces the practice'. There is no such TDD-enforcing mechanism to cite, so the mandatory TDD inventory row cannot be honestly filled as adopted-and-enforced.

### Motivation

This is a load-bearing contradiction, not a style nit: the inventory's demand for an enforcing citation for the TDD row directly contradicts the absence of any red-first enforcement gate, and the file is silent on how TDD ordering is verified for TypeScript/Svelte, so the seed's headline discipline is specified but not enforced.

### Proposed Changes

Resolve the contradiction one of two ways and say which. (a) Specify a concrete red-first verification approach the aggregate check can run — for example a coverage-diff gate that fails when newly added or changed first-party source lines are not covered by tests introduced in the same changeset, and/or a documented PR-level red-commit-evidence convention wired into CI. Or (b) explicitly permit TDD to be dispositioned in §'Discipline adoption inventory' as process-enforced-not-gate-enforced, and amend the inventory so a genuinely process-only discipline is NOT required to cite an automated enforcing mechanism (see the related enforcement-vs-documentation finding). Cross-reference §'Definition of done for implementation work' so the chosen path is unambiguous.

## Proposal: Discipline-adoption inventory conflates 'enforces the practice' with 'cites a documentation path'

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

§'Discipline adoption inventory' requires adopted and locally adapted rows to 'cite a local TypeScript, Svelte, Bun, Vercel, GitHub, hook, work-item, or documentation mechanism that enforces the practice', and the aggregate-check clause of the same section only requires bun run check to verify that adopted/adapted rows 'cite existing local commands, workflows, hooks, work-item records, or documentation paths'. Documentation describes a practice; it does not enforce it. So a discipline can be recorded as adopted-and-enforced while pointing only at prose, and the check that is supposed to guarantee enforcement is satisfied by a resolvable documentation path. This is the general loophole that the TDD finding falls through, and it applies to any dial (e.g. livespec-dev-tooling guidelines) whose local enforcement is thin.

### Motivation

The phrase 'documentation mechanism that enforces the practice' is internally contradictory, and the aggregate check's acceptance of a bare documentation-path citation is inconsistent with the seed's explicit 'specify AND enforce' mandate — the gate meant to prove enforcement accepts documentation as a substitute for it.

### Proposed Changes

Split the citation model in §'Discipline adoption inventory'. Require each adopted or locally adapted row to declare an enforcement class: gate-enforced (MUST cite a specific command, hook, or CI workflow that FAILS when the practice is violated) or documented-only (MAY cite a doc path but MUST NOT be described as enforced, and MUST record why no gate exists). The aggregate check MUST verify that gate-enforced rows cite a runnable command/hook/workflow — not merely a documentation path — and SHOULD verify the cited gate is actually wired into bun run check or the required CI status check. This lets honestly-un-gateable disciplines be recorded truthfully while stopping documentation from masquerading as enforcement.

## Proposal: Required 'livespec-dev-tooling shared guidelines' inventory row has no committed definition to check against

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The seed (archive/livespec-seed.md, item 3) explicitly names 'the livespec-dev-tooling shared guidelines' as a discipline to adopt, and §'Discipline adoption inventory' mandates a baseline row for 'livespec-dev-tooling-inspired shared guidelines'. But nowhere does this file — or any committed artifact it references — state what those guidelines contain or which concrete TypeScript/Svelte practices they are meant to inspire. The §'Boundary' standalone rule and constraints.md §'Standalone boundary' forbid depending on the sibling livespec-dev-tooling checkout, so the source of truth for the guidelines is unreachable from this repo. The required inventory row is therefore unfalsifiable: a contributor can mark it adopted against no committed reference, and (per the enforcement-vs-documentation finding) the aggregate check only confirms the citation resolves, not that it corresponds to any actual guideline.

### Motivation

The content of the 'shared guidelines' dial is left undefined while a row for it is mandatory, which makes the row's disposition ambiguous and unverifiable — the spec requires enforcing a discipline it never states, for the TypeScript/Svelte environment.

### Proposed Changes

Enumerate the specific dev-tooling guidelines being inspired, either inline in this file or in a committed .ai/*.md note referenced from AGENTS.md per §'Local memory guardrails', and map each guideline to its local TypeScript/Svelte/Bun/Vercel enforcement artifact (candidates already present in this file include aggregate-check-as-single-gate, the §'Exit-code baseline', §'Result and railway-oriented programming discipline', hermetic no-network tests, and pinned reproducible toolchain). The inventory row MUST then cite that committed enumeration, so 'adopted' is checkable against a local definition rather than an unreachable sibling repository.

## Proposal: 'Fuzzing' dial is satisfiable by property tests alone; the seed-to-spec adaptation is never stated

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The seed (archive/livespec-seed.md, item 3) lists 'fuzzing' as a distinct discipline dial alongside linting, but §'Fuzzing and property checks' consistently writes 'property-based or fuzz-style' tests and the §'Discipline adoption inventory' baseline row is 'fuzzing and property checks'. Because of the inclusive 'or', the gate is fully satisfied by deterministic property-based tests (e.g. fast-check generators over valid domain values); nothing in the file ever requires actual fuzzing — adversarial, random, or malformed input beyond the generated valid-domain space — even for the malformed-input targets it enumerates (governed YAML parse/transform rejection, markdown/HTML syntax stripping). Property-based testing is the idiomatic TypeScript adaptation of fuzzing, but the file never says that is the intended substitution, nor records it as a locally-adapted disposition.

### Motivation

Whether property-based testing is the accepted TypeScript adaptation of the seed's fuzzing dial, or genuine fuzzing is additionally required, is left unclear; the 'or' makes the fuzzing requirement silently optional, so the seed's fuzzing discipline is ambiguously specified and not distinctly enforced.

### Proposed Changes

State the mapping explicitly. Either (a) declare in §'Fuzzing and property checks' and §'Discipline adoption inventory' that deterministic property-based testing IS the adopted TypeScript adaptation of the seed's fuzzing dial, recorded as a locally-adapted disposition with rationale so the seed->spec correspondence is committed and checkable, or (b) require a distinct malformed/adversarial-input fuzz gate for the enumerated parse/normalize/strip targets in addition to the property tests, and wire it into bun run check. Close the 'or' or record the adaptation so the fuzzing dial is not quietly discharged by property tests without acknowledgement.
