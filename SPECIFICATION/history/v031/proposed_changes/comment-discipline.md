---
topic: comment-discipline
author: claude-opus-4-8
created_at: 2026-07-10T10:39:54Z
---

## Proposal: comment-discipline

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

Add a `Comment discipline` policy under §"Constraints" that bans
rotting, provenance-breadcrumb comments in committed first-party source
and enforces the ban with a new standalone `bun run check` gate. This
mirrors the livespec fleet's §"Comment discipline" (Rule 1 WHY-not-WHAT,
judgment-based; Rule 2 no historical-bookkeeping references, mechanized),
adapted to this repository's standalone TypeScript toolchain and with the
mechanical banned set extended to this repo's breadcrumb forms
(work-item ids, planning-thread paths, design-doc slice references,
commit SHAs, and PR numbers). Durable present-tense pointers to the
living specification remain permitted. Add a corresponding §"Scenario".

### Motivation

The maintainer directs that resume adopt the livespec fleet's ban on the
"rotting", prone comments that LLM authors accumulate in source control —
comments that cite transient project-management artifacts (planning-thread
paths, design-document slice numbers, work-item ids, commit SHAs, PR
numbers, spec version/decision/phase/cycle markers). These duplicate an
audit trail that already lives in `SPECIFICATION/history/`, `git log`, and
proposed-change files, and they bit-rot: the referenced slice, id, path,
or version drifts or is archived, leaving a stale breadcrumb that costs a
future reader archeology time and misleads. This repository's product
source (`src/**`) and `e2e/**` are already clean, but the check-harness
scripts under `scripts/**` carry roughly eighty such breadcrumb comment
lines. Ratifying the ban and backing it with a committed gate removes the
class rather than relying on author judgment, consistent with this repo's
gate-enforced discipline.

### Proposed Changes

In `non-functional-requirements.md`, add a new `### Comment discipline`
subsection under `## Constraints` (adjacent to §"Hooks" and the other
quality-gate constraints), with the following normative text:

> ### Comment discipline
>
> Comments in first-party source trees — `scripts/**`, `src/**`,
> `e2e/**`, `.github/workflows/*.yml`, and repository configuration files
> (for example `.livespec.jsonc`, `eslint.config.js`, `tsconfig.json`) —
> MUST follow two rules.
>
> **Rule 1 — WHY-not-WHAT.** A comment MUST explain WHY a block exists
> when the WHY is non-obvious to a future reader: a hidden constraint, a
> subtle invariant, a workaround for a specific tooling bug, or behavior
> that would surprise the reader. A comment MUST NOT merely restate WHAT
> the code does — well-named identifiers and the surrounding spec already
> convey WHAT. If removing a comment would not confuse a future reader
> who can read the code, the comment MUST be deleted. Rule 1 is
> judgment-based; it is enforced by code review and MUST NOT be
> mechanically enforced.
>
> **Rule 2 — No historical-bookkeeping references.** Comments MUST NOT
> cite provenance or temporal/historical bookkeeping markers, including:
> spec version numbers and decision ids (for example `v030`,
> `Per v028 D1`), phase or cycle numbers (for example `Phase 4`,
> `cycle 117`), commit references (a commit SHA cited as provenance,
> `merge <sha>`, `this commit`, `the previous PR`), pull-request numbers
> (for example `PR #2`), work-item or ledger ids (for example
> `li-6tntj5`), planning-thread paths (for example `plan/guardrail/…`),
> design-document references (for example `findings.md`, `slice 8`), and
> "watcher fix" / "watcher bypass"-style bookkeeping phrases. A comment
> MUST state the live constraint in present tense, without reference to
> when, why-historically, or by-which-decision the constraint was
> adopted. The audit trail of decisions lives in
> `SPECIFICATION/history/vNNN/`, `git log`, and per-revision
> proposed-change files; duplicating it in source comments creates
> bit-rot risk and reader-archeology cost.
>
> Durable present-tense pointers to the living specification — a
> reference of the form `SPECIFICATION/<file>.md §"<Section>"` or
> `<file>.md §"<Section>"` — are NOT historical-bookkeeping references
> and remain permitted, because they point at the maintained spec rather
> than a frozen artifact.
>
> Comments MUST NOT anchor to line numbers (for example `lines 12-18`,
> `line ~40`); line-number anchors silently rot on any edit. Reference a
> symbol, section name, or file instead.
>
> **Scope exemptions.** Rules 1 and 2 do NOT apply to: the front-matter
> and body of files under `SPECIFICATION/` (the spec is the historical
> record; cross-references to spec sections are acceptable there);
> `SPECIFICATION/history/vNNN/` snapshots (immutable); `archive/**` and
> `plan/archive/**` (frozen historical artifacts); `plan/**` planning
> threads (project-management artifacts that legitimately cross-reference
> threads, work items, and versions); and any vendored or generated tree.
>
> **Enforcement.** A committed, standalone gate (for example
> `scripts/check-comments.ts`) MUST be added to `bun run check` that
> scans the comments and docstrings — never string literals — of every
> in-scope file for the Rule 2 banned markers and the line-number-anchor
> pattern, and exits non-zero with structured findings naming each
> violation site. The gate MUST be standalone per `constraints.md`
> §"Standalone boundary" (the pinned TypeScript compiler API; no livespec
> fleet Python tooling) and categorized so it is skipped when no in-scope
> file changes. Rule 1 (WHY-not-WHAT) is judgment-based and MUST NOT be
> mechanically enforced — code review is the gate. There MUST be no
> configuration allowlist or inline escape marker that permits a
> historical-bookkeeping reference to remain in a source comment.

Also add a scenario under `## Scenarios`:

> ### Scenario: Source comments cannot carry rotting provenance references
>
> Given a comment in an in-scope source tree cites a historical-bookkeeping
> marker (a version or decision id, phase or cycle number, commit SHA, PR
> number, work-item id, planning-thread path, design-document reference,
> or line-number anchor)
>
> When the aggregate check runs
>
> Then the comment-discipline gate fails, naming the violation site,
> unless the reference is a durable present-tense pointer to a living
> specification section or the file is in an exempt tree
