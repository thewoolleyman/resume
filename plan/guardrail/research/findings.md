# Research - guardrail harness

Design of record for `plan/guardrail/`. This plan begins after
`plan/adversarial-spec-hardening/` converged both:

- Phase NF - non-functional/process hardening of
  `SPECIFICATION/non-functional-requirements.md`.
- Phase FN - functional/product hardening of `SPECIFICATION/spec.md`,
  `contracts.md`, `constraints.md`, and `scenarios.md`.

The active handoff is `plan/guardrail/handoff.md`.

## Goal

Build the initial guardrail harness required by
`SPECIFICATION/non-functional-requirements.md` before any first-party product
source under `src/**` lands on `master`.

This plan does NOT build the resume product. It provisions the repository
tooling that the product work must run under: bootstrap, aggregate checks,
TDD commit enforcement, lint/type/test/coverage/property/scenario gates, CI and
pull-request automation, branch-protection/settings verification, local memory
guards, and the discipline inventory.

## Source of truth

The authoritative requirements are in
`SPECIFICATION/non-functional-requirements.md`, especially:

- Section "Guardrail provisioning boundary" - every gate is provisioned additively;
  there is no bootstrap-mode exemption after a gate exists.
- Sections "Discipline adoption inventory" and "Livespec ecosystem tooling adoption" -
  `.ai/discipline-adoption.md` and the local adoption record.
- Section "Mechanically enforced Red -> Green commit protocol" - the content-triggered
  TDD commit-msg hook, `tdd-commit` helper, and branch-range validation.
- Section "Top-of-pyramid discipline" - scenario-to-test mapping for
  `SPECIFICATION/scenarios.md`.
- Sections "Aggregate command" and "Package script categories" - `bun run check` and
  the required Bun script surface.
- Sections "GitHub CI and pull request discipline" and "Pull request landing
  automation" - `.github/workflows/check.yml`, `.github/workflows/auto-enable-merge.yml`,
  documented required status checks, and branch-protection/settings verification.
- Section "Local memory guardrails" - committed hook plus aggregate enforcement for
  prohibited memory paths and `.ai/*.md` indexing.
- Sections "TypeScript quality gates", "Result and railway-oriented programming
  discipline", "Test coverage expectations", and "Fuzzing and property
  checks" - strict TypeScript/Svelte/linting, Result/ROP AST or type gates,
  100% line and branch coverage for first-party `src/**` product source, and
  reproducible `fast-check`-style property gates.

## Non-goals

- Do not implement the interactive resume, static resume, AI mode, or MCP
  surface in this plan.
- Do not create first-party product source under `src/**` until the guardrails
  that must precede the first product-source merge are present, operational, and
  green.
- Do not capture product implementation gaps yet. Gap detection and ordering
  for the searchable + static-text MVP belongs to `plan/mvp`, after this plan
  completes.
- Do not re-open the adversarial spec-hardening loop unless implementation
  reality exposes a genuine spec defect. Use livespec propose-change/revise for
  such defects.

## Operator surface

This plan must be driveable in either Claude Code or Codex.

Preferred operator loop:

1. Run `needs-attention` - the cross-plan triage surface that lists the next
   actionable spec, implementation, human-valve, and hygiene items.
2. Run `drive --action <action-id>` - execute exactly one selected action.
3. Commit and push each coherent unit to `master`.

Sessions run this loop autonomously — pick, execute, land, repeat — stopping
only for a blocker that needs a human maintainer decision or intervention,
plan completion, or session limits. See `plan/guardrail/handoff.md`
§"Loop autonomously until blocked or complete".

This loop is backed by the livespec-orchestrator-beads-fabro operator
surface:

- Use the livespec-orchestrator-beads-fabro `next` skill to rank the next
  implementation work item.
- Use the livespec-orchestrator-beads-fabro `implement` skill to drive exactly
  one work item Red -> Green.
- If no guardrail work items exist yet, seed them from the work slices below
  using the livespec-orchestrator-beads-fabro `capture-work-item` skill. Every
  work item must include a human-readable title and description; never refer to
  it only by an opaque action id or work-item id.

## Work slices

Seed or drive work in this order. The order matters because the guardrail
provisioning boundary requires additive enforcement: each newly introduced gate
must be green from the commit that introduces it onward.

1. **Repository bootstrap and package-script surface.** Add pinned Bun/SvelteKit
   project metadata as needed, `bootstrap`, `check`, `dev`, `build`,
   `typecheck`, `lint`, `format:check`, `test:unit`, `test:integration`,
   `test:e2e`, `test:coverage`, `test:property`, `check:scenarios`,
   `check:result`, `check:memory`, and `tdd-commit` scripts or documented
   stricter equivalents. `bootstrap` must install committed hooks.
2. **Aggregate check skeleton.** Make `bun run check` the single non-mutating
   quality gate and have it verify the required script surface, toolchain
   configuration, and CI delegation as those artifacts appear.
3. **TypeScript, Svelte, lint, and format gates.** Add strict TypeScript,
   Svelte-aware validation, accessibility linting, formatter checks, zero lint
   warnings, import/order/boundary checks, and checks that prevent weakening the
   committed baseline silently.
4. **Content-triggered Red -> Green TDD gate.** Add the standalone Bun/TypeScript
   commit-msg hook, branch-range validator for `origin/master..HEAD`, trailer
   grammar, anchor-test checksum verification, full-suite Suite-Green evidence,
   and `tdd-commit` helper. This is the local transcription specified in the
   spec, not a dependency on sibling fleet tooling.
5. **Local memory guardrail.** Add the committed hook and `check:memory` gate
   that reject prohibited hidden memory/tool-state paths, unindexed `.ai/*.md`
   notes, and dangling `AGENTS.md` links. Add `.ai/discipline-adoption.md` and
   index it from `AGENTS.md`.
6. **GitHub CI and pull-request automation.** Add `.github/workflows/check.yml`,
   `.github/workflows/auto-enable-merge.yml`, required status-check
   documentation, merge-method/branch-protection documentation, and local
   settings verification. Live `gh` verification may run when credentials are
   available, but local documented verification must still exist.
7. **Result/ROP enforcement gate.** Add the typed Result/DomainError contract
   and local TypeScript/ESLint/AST checks for public Result typing, ignored
   Results, floating promises, exhaustive `DomainError.kind` handling, blanket
   catch restrictions, and no raw error/provider-payload rendering.
8. **Coverage and property gates.** Enforce 100% line and branch coverage for
   first-party `src/**` product source and add reproducible property/fuzz gate
   checks using `fast-check` or a documented stricter Bun/Vitest-compatible
   equivalent.
9. **Scenario coverage gate.** Add the committed scenario mapping data and
   `check:scenarios` gate for every load-bearing scenario in
   `SPECIFICATION/scenarios.md`, with Playwright mappings for browser-observable
   scenarios and named non-Playwright category mappings plus rationales for
   non-browser-exercisable scenarios.
10. **Green precondition for product work.** Verify `bun run check` passes with
    all guardrail gates present. Only then complete this plan.
11. **Terminal handoff.** Create `plan/mvp/research/findings.md` and
    `plan/mvp/handoff.md`, flip `.livespec.jsonc` `post_step_skip_capture_impl_gaps`
    back to `false` or remove the skip, and hand off to MVP implementation
    planning for the searchable interactive resume plus static-text resume only.

## Completion criteria

This plan is complete when:

- The guardrail harness required before the first `src/**` product-source merge
  is present, operational, and green.
- `bun run check` passes and includes the required gate families.
- Bootstrap-installed hooks are reproducible from committed configuration.
- CI and pull-request automation are documented and locally verified.
- `.ai/discipline-adoption.md` exists, is indexed from `AGENTS.md`, and is
  checked by the aggregate gate.
- `plan/mvp/` exists and `.livespec.jsonc` no longer suppresses implementation
  gap capture for the MVP plan.

## Communication rule

Never talk to a human using only an opaque phase code, work-item id, action id,
version id, or command token. Always pair the token with a human-readable
description of the work and the files or behavior it affects. Say
"`check:memory` - the local memory guardrail that rejects prohibited hidden
tool-state paths and unindexed `.ai/*.md` notes", not just "`check:memory`".
