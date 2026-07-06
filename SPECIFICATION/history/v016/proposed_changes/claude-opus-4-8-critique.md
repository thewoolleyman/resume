---
topic: claude-opus-4-8-critique
author: claude-opus-4-8
created_at: 2026-07-06T22:02:16Z
---

## Proposal: Red -> Green leg selection is both content-triggered and subject-prefix-dependent

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

In §"Mechanically enforced Red -> Green commit protocol", the enforcement paragraph states that leg selection is "content-triggered — the staged file content selects the leg, never the commit subject prefix", yet the Red-leg rule says "A staged anchor test that already PASSES under a `feat:` or `fix:` subject MUST be rejected as an invalid Red moment", which makes the leg's pass/fail expectation depend on the commit subject prefix. The two clauses are in direct conflict, and the conflict is load-bearing because the commit-msg hook cannot deterministically classify a commit that stages exactly one new test file alone with the implementation unmodified: that identical content signature is shared by (a) a Red leg, whose anchor test the hook MUST run and require to FAIL, and (b) a passing test-only Suite-Green cleanup, whose full suite the hook MUST run and require to PASS. Content alone cannot disambiguate the two legs, so the gate's deterministic behavior is unspecified.

### Motivation

This is a contradiction between two ratified clauses of the most load-bearing, mechanically-enforced guardrail: 'the staged file content selects the leg, never the commit subject prefix' contradicts the invalid-Red rule that keys off the `feat:`/`fix:` subject. The only discriminator the spec offers for the shared 'one test file staged alone, impl unmodified' signature is exactly the subject prefix the first clause forbids the hook from using, and an outcome-only reading (fail => Red, pass => Suite-Green) is foreclosed because it would make a passing staged-alone test a valid Suite-Green rather than the 'MUST be rejected' invalid Red the spec demands. The design-of-record (plan/adversarial-spec-hardening/research/findings.md) settles that TDD is gate-enforced via the checksummed-trailer red_green_replay adaptation but does NOT pin a leg-selection discriminator, so the resolution direction is open for the reviser rather than dictated by settled ground.

### Proposed Changes

The reviser MUST pin ONE deterministic discriminator that the commit-msg hook uses to select among the Red, Green, and Suite-Green legs for a commit that stages exactly one test file alone with the implementation unmodified, and MUST make the enforcement paragraph and the Red-leg invalid-Red rule agree on it. Either (a) keep leg selection content/outcome-triggered and reword the invalid-Red rule so it does not reference the subject prefix (e.g., a staged-alone test that PASSES is routed to the Suite-Green leg, not 'rejected'), or (b) admit the subject prefix (or an explicit `tdd-commit`-set marker) as the load-bearing discriminator and delete the 'never the commit subject prefix' claim. This critique surfaces the contradiction only; it does not choose (a) vs (b) — that is the reviser's accept/modify/reject call, and the maintainer's if it touches the settled red_green_replay contract.

## Proposal: Commit-level pairing gate contradicts the Suite-Green refactor/chore allowance

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

§"Mechanically enforced Red -> Green commit protocol" defines two distinct gates whose scopes collide. The commit-level pairing gate "MUST require any commit that changes first-party product source to also stage at least one test file", while the Suite-Green leg explicitly admits "a refactor, a chore touching first-party product source" that "introduces no new failing test" — a commit that by its nature changes product source and stages NO test file. The exemption clause in the same section only exempts refactors/chores from "the Red -> Green pair requirement" (the checksummed-trailer pair), not from the separate commit-level pairing gate. As written, the unqualified pairing gate ('any commit that changes first-party product source') would block the exact pure-refactor and chore commits the Suite-Green leg is designed to permit.

### Motivation

This is a contradiction between two mechanically-enforced gates that return opposite verdicts on the same Suite-Green refactor/chore commit: the pairing gate demands a staged test file on any source-changing commit, and the Suite-Green leg permits a source-changing commit with no test file. The interaction is left inconsistent — the exemption is worded against 'the Red -> Green pair requirement' but the pairing gate is a separately named requirement, so whether the pairing gate fires on Suite-Green commits is undefined. The design-of-record settles that source-to-test pairing follows the fleet's proven 'commit-level co-staging plus per-file coverage' model but does not resolve this refactor-path edge.

### Proposed Changes

The reviser MUST scope the commit-level pairing gate so it does not fire on Suite-Green refactor/chore commits, or MUST state the intended interaction explicitly. Options include: restrict the pairing gate to commits taking the Red -> Green pair path; or state that a Suite-Green commit satisfies pairing via the passing full-suite run plus the per-file coverage gate rather than by staging a test file; or add refactor/chore commits to the pairing gate's exemption set on the same machine-checkable basis as the other exemptions. The corrective edit MUST leave exactly one deterministic answer to 'does a pure-refactor commit that stages no test file pass or fail the pairing gate' — this critique does not select which.

## Proposal: The TDD gate domain 'first-party product source' is undefined, including whether the harness is in scope

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

The commit-level pairing gate and the per-file coverage gate in §"Mechanically enforced Red -> Green commit protocol" range over "first-party product source" and "every first-party source file", and the `origin/master..HEAD` range validation keys on "every non-merge commit touching first-party product source" — but no clause defines which files constitute first-party product source. §"Result and railway-oriented programming discipline" enumerates its OWN core directories (src/data|domain|search|grounding|mcp-contracts, src/adapters|server|api, src/routes|components) and §"Test coverage expectations" distinguishes first-party core from 'framework glue', yet neither delimits the file-set the TDD pairing/coverage/range gates operate on. The exemption list (generated artifacts, lockfiles, docs-only, spec-only, formatting-only changes) gives negatives but never a positive boundary.

### Motivation

The gate's domain is undefined, so a mechanically-enforced gate cannot deterministically decide whether a given changed file requires a paired test, per-file coverage, or a TDD trailer — the classification rule is silent. This is acutely load-bearing because the design-of-record's exit criterion states that THE FIRST REAL CODE IS THE HARNESS (bootstrap, `bun run check`, the commit-msg hook, the lint config, CI, the memory hook): on commit #1 the harness-builder must know whether the harness/tooling scripts, git hooks, `.github/workflows`, and config files are themselves 'first-party product source' subject to Red -> Green pairing and per-file coverage, or excluded. Nothing in the spec answers this, so the very act of building the guardrails is un-gated in an unspecified way.

### Proposed Changes

The reviser MUST define the positive scope of 'first-party product source' for the TDD pairing gate, the per-file coverage gate, and the `origin/master..HEAD` range validation — for example by naming the in-scope root(s) (such as `src/**`) and enumerating the categories treated as tooling/harness rather than product source. The edit MUST state explicitly whether the harness/tooling code (bootstrap, aggregate-check and gate scripts, git hooks, `.github/workflows`, lint/TS/Vercel config) is IN or OUT of the TDD/pairing/coverage gates, so the first real code — the harness itself — has a determinate discipline. This critique surfaces the missing definition and the harness-in-scope question; it does not choose the boundary.
