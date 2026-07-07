---
topic: claude-opus-4-8-critique
author: claude-opus-4-8
created_at: 2026-07-07T03:02:04Z
---

## Proposal: Coverage relative floor is undefined on the function and branch dimensions

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

In §"Test coverage expectations", first-party core is floored on three dimensions (>= 90% line, >= 90% function, >= 85% branch) but framework glue is floored on only one (>= 60% line). The anti-gaming rule then requires that `bun run check` "MUST fail when the first-party-core thresholds are not strictly higher than the framework-glue thresholds on every dimension." Because glue has no committed function or branch floor, the phrase "on every dimension" has no glue operand for function and branch, so the strictly-higher comparison is undefined on two of the three dimensions.

### Motivation

This is a load-bearing ambiguity, not a wording nit: a verifier author cannot deterministically decide the function/branch comparison when glue declares no function/branch threshold, and the outcome is left undefined. The weakening is concrete — an implementation could set the glue function and branch thresholds arbitrarily low (or omit them), escaping both the "below its floor" check (no glue floor exists on those dimensions) and the relative "strictly higher on every dimension" check, which defeats the anti-gaming intent on two of three dimensions while the rule still reads as fully enforced. It refines the edge of the Settled (v017) coverage-floor decision (core >= 90/90/85, glue >= 60 line, core strictly > glue, exact percentages tunable) rather than reversing it: the settled record fixes the floors and the strictly-greater rule but does not say how the comparison behaves on dimensions where glue carries no committed floor, so the resolution is a maintainer/reviser edge decision, not a re-litigation.

### Proposed Changes

Make the relative comparison deterministic on every named dimension. Pick ONE of: (a) framework glue MUST also declare committed function and branch coverage thresholds, each with its own non-trivial floor, so "strictly higher on every dimension" always has both operands and `bun run check` MUST fail when a glue function/branch threshold is absent or below its floor; or (b) explicitly scope the strictly-higher comparison to the dimensions on which glue carries a committed floor (line), and state that glue function and branch coverage are otherwise unconstrained — in which case the prose SHOULD drop "on every dimension" so it no longer implies a comparison the gate cannot perform. Either way, the section MUST make it unambiguous which dimensions the strictly-higher check runs on and what `bun run check` does when a glue threshold for a compared dimension is missing.

## Proposal: Commit-msg TDD gate contradicts the Hooks guidance and leaves per-commit leg scope ambiguous

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

§"Hooks" states that "Local hooks SHOULD run fast checks before commit and the aggregate check before push," but §"Test-Driven Development discipline" makes the Suite-Green leg part of the per-commit commit-msg hook and requires it to "pass the FULL suite against the staged tree." The same section routes refactors, chores, documentation-only changes, spec-only revisions, generated artifacts, dependency lockfile refreshes, and mechanical formatting-only changes onto the Suite-Green leg — i.e. the large majority of everyday commits — so the commit-msg hook runs the full (including Playwright) suite at commit time for most commits, which contradicts the "fast checks before commit / aggregate check before push" guidance. Separately, "A missing, unknown, or conflicting `TDD-Intent` marker MUST reject before any ... evidence is accepted" reads as requiring a TDD-Intent leg on every commit, whereas the `origin/master..HEAD` range validation only constrains commits touching first-party product source under `src/**`, leaving it unresolved whether a commit that touches neither `src/**` nor any test file must take a leg (and therefore run Suite-Green's full suite) at all.

### Motivation

The contradiction is load-bearing because §"Hooks" and §"Test-Driven Development discipline" give conflicting answers to a concrete implementation question — where the full suite runs (commit-time hook vs. pre-push/CI) and how heavy the commit-msg hook is — so a hook author cannot build the gate without picking a side, and the second reading makes the everyday commit-msg hook run the full browser suite on trivial documentation and spec commits. The design record (research/findings.md §"Settled") settles the TDD gate mechanism (gate-enforced red_green_replay adaptation, the `TDD-Intent` Red/Green/Suite-Green legs, the per-commit commit-msg hook plus `origin/master..HEAD` range validation, and `src/**` as first-party product source) but is silent on whether the commit-msg hook itself must execute the full suite for Suite-Green and on whether commits touching neither `src/**` nor tests are inside the TDD-Intent requirement; per the intent-preservation rule I surface that absence for the maintainer rather than self-resolving it, and note the resolution refines these edges without reversing the settled gate-enforced mechanism.

### Proposed Changes

Reconcile the two sections so they agree on where the full suite runs and which commits need a leg. Recommended direction: state that the commit-msg hook performs only FAST staged-tree verification — for Red/Green, running the single anchor test (already the case); for Suite-Green, a fast staged-tree check sufficient to record the `TDD-Suite-Green-*` trailers — and that the authoritative FULL-suite validation runs in `bun run check` and CI (the pre-push / range-validation path §"Hooks" already reserves for the aggregate check), so §"Hooks" and the Suite-Green leg no longer disagree about commit-time cost. If instead the full suite is intended to run at commit time, §"Hooks" MUST be amended to say so for TDD commits rather than reading as "fast checks before commit." Independently, the TDD section MUST state explicitly whether a commit touching neither first-party product source under `src/**` nor any test file is inside or outside the `TDD-Intent` requirement — either exempt such commits from needing a leg (aligning the commit-msg hook's scope with the product-source-scoped range gate) or require a leg on every commit and accept the Suite-Green cost — so the commit-msg hook has one deterministic answer for every staged tree.
