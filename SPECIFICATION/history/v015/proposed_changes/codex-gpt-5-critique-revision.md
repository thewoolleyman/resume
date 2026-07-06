---
proposal: codex-gpt-5-critique.md
decision: modify
revised_at: 2026-07-06T20:53:54Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Accept all five proposal sections in codex-gpt-5-critique as a concrete non-functional revision. P1 makes the package-script surface a named MUST before the first non-trivial implementation merge. P2 is resolved using the livespec fleet's PROVEN multi-file TDD approach (verified in the Python livespec-dev-tooling and Rust livespec-console-beads-fabro repos) rather than codex's literal 'test-artifact set' reinvention: a single designated anchor test is staged alone and checksummed while the Green amend carries all implementation files plus any supporting/updated test artifacts, with supporting test infrastructure committed first via the Suite-Green leg; source-to-test pairing stays commit-level co-staging plus per-file coverage, generalized to TS/Svelte test locations. P3 promotes the concrete lint/format baseline from SHOULD to MUST. P4 fully gate-enforces the pull-request path before the first non-trivial implementation merge per the maintainer's explicit choice, reconciled with the repo's ratified sanctioned direct-owner-commit path by relying on the on-push aggregate-check workflow to gate direct commits and requiring branch protection to gate the PR merge path without requiring a pull request for every change. P5 adds a TypeScript property/fuzz reproducibility contract.

## Modifications

All five ## Proposal sections resolved in non-functional-requirements.md. P2 deliberately departs from codex's literal proposed 'test-artifact set + checksum-all' design: research of the fleet's real Python and Rust TDD commits (e.g. ad807ea — 4 impl + 4 test files under one checksummed anchor test) shows the proven approach uses a single anchor-test checksum with impl and supporting tests riding in the Green amend; that proven model landed, generalized to TS/Svelte co-located / tests-mirror / Playwright test locations. P4 departs from v014's 'PR path provisioned-only-on-demand' framing to full gate-enforcement before first impl merge, explicitly reconciled with the ratified direct-owner-commit path via the on-push aggregate check. Added contributor-workflow scenarios for the package-script surface, property/fuzz reproducibility, and PR-discipline provisioning; updated the TDD scenario to the anchor-test model.

## Resulting Changes

- non-functional-requirements.md
