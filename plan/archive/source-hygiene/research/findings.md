# Findings — source-hygiene (comment discipline)

Design of record for `plan/source-hygiene/`. This thread bans the
"rotting", provenance-breadcrumb comments that accumulate in committed
source — plan-thread paths, design-doc slice numbers, work-item ids,
commit SHAs, PR numbers, version/decision/phase/cycle markers — purges
the existing ones, and only then archives the completed plan threads so
nothing dangles.

## Goal

1. **Ratify** a `Comment discipline` policy in
   `SPECIFICATION/non-functional-requirements.md` (§"Constraints"),
   mirroring the livespec fleet's policy, adapted to this repo's
   standalone TypeScript toolchain.
2. **Enforce** it mechanically with a new aggregate-check gate.
3. **Purge** every existing breadcrumb comment from committed code.
4. **Archive** the completed `guardrail` and `adversarial-spec-hardening`
   plan threads cleanly (they are currently referenced only by the
   breadcrumbs being purged, plus a few doc/config back-references).

## What is being mirrored

The livespec project (`SPECIFICATION/non-functional-requirements.md`
§"Comment discipline") defines two rules for first-party source:

- **Rule 1 — WHY-not-WHAT.** A comment MUST explain the non-obvious WHY
  (a hidden constraint, an invariant, a tooling-bug workaround, or
  surprising behavior), never restate WHAT the code does. Judgment-based;
  enforced by code review, deliberately NOT mechanized.
- **Rule 2 — No historical-bookkeeping references.** Comments MUST NOT
  cite version numbers, decision ids, phase/cycle numbers, commit
  references, or any other temporal/historical bookkeeping marker. The
  audit trail lives in `SPECIFICATION/history/`, `git log`, and
  proposed-change files; duplicating it in source comments creates
  bit-rot. Mechanically enforced.

livespec enforces Rule 2 with `comment_no_historical_refs.py`, which
scans only comments and docstrings (string literals are out of scope),
exempts `SPECIFICATION/**`, `SPECIFICATION/history/**`, `archive/**`, and
vendored code, and has no allowlist/inline-marker escape hatch.

## The banned set (this repo's adaptation)

livespec's mechanical regex catches only an enumerated marker set
(`vNNN X#`, `per vNNN`, `phase N`, `cycle N`, `this commit`,
`the previous commit/PR`). This repo's breadcrumbs are broader, so the
mirrored gate's banned set is **extended** to also catch:

- work-item ids: `li-<id>` (and any `<tenant>-<id>` ledger id form)
- plan-thread paths: `plan/<thread>/…`
- design-doc references: `findings.md`, `slice N`
- landing references: commit SHAs cited as provenance, `merge <sha>`,
  `PR #N`
- the "watcher fix"/"watcher bypass" bookkeeping phrasing

**Kept (NOT banned):** durable present-tense pointers to the living
spec — `SPECIFICATION/<file>.md §"<Section>"` and `constraints.md
§"<Section>"`. These reference the maintained specification, not a
frozen historical artifact, and are the opposite of rotting.

## Scope

- **In-scope trees** (the gate scans these): `scripts/**`, `src/**`,
  `e2e/**`, `.github/workflows/*.yml`, and repository config comments
  (e.g. `.livespec.jsonc`, `eslint.config.js`, `tsconfig.json`).
- **Exempt:** `SPECIFICATION/**` (the spec IS the historical record;
  cross-references to spec sections are acceptable there),
  `SPECIFICATION/history/**` (immutable), `archive/**` and
  `plan/archive/**` (frozen artifacts), `plan/**` (planning threads are
  project-management artifacts by nature and legitimately cross-reference
  each other, work items, and versions), and any vendored/generated
  tree.
- The gate scans **comments and docstrings only**, never string
  literals — so functional data (e.g. a fixture array of work-item ids,
  or an excluded-paths string) is untouched. Test-name string
  decorations like `describe("… (li-xxxxxx)")` are string literals and
  are cleaned up by hand, not by the gate.

## Gate design

- `scripts/check-comments.ts` — standalone Bun/TypeScript, using the
  pinned TypeScript compiler API to extract comment ranges (no external
  enforcement suite, per `constraints.md` §"Standalone boundary").
  Applies the extended banned regex to comment text only; exits non-zero
  with a structured per-violation report. Wired into `bun run check`;
  categorized so it is skipped when no in-scope files change.
- A sibling line-number-anchor ban (livespec's `check-comment-line-anchors`)
  rejecting comments like `lines 12-18` / `line ~40`, which silently rot
  on any edit. Realized in the same gate or an adjacent one.
- Harness tests (`scripts/check-comments.test.ts`) pin the accept/reject
  boundary: reject each banned marker class in a comment; accept
  WHY-form comments, durable spec-section pointers, and banned text that
  appears only inside a string literal or in an exempt tree.
- No allowlist and no inline escape marker, matching livespec — the
  design intent is that provenance belongs in history/git, never source
  comments. (`# noqa`/`# type: ignore`-style present-tense escapes are
  already WHY-formed and do not match the banned regex.)

## Work slices

1. **Propose** — file the `comment-discipline` proposed change (this
   thread's first landing).
2. **Revise** — accept it; cut a new spec version.
3. **Implement** — add the gate(s) + harness tests; wire into
   `bun run check`.
4. **Purge** — remove every breadcrumb comment from in-scope code
   (~80 lines across `scripts/**` plus the `.livespec.jsonc` comment);
   the new gate goes green.
5. **Archive** — `git mv` the completed `guardrail` and
   `adversarial-spec-hardening` threads to `plan/archive/`, repointing
   the few remaining non-code back-references (`AGENTS.md`,
   `plan/mvp/**`, `.githooks/README.md`).

Slices 3 and 4 land together (the gate cannot be green while the
existing breadcrumbs remain).

## Completion criteria

- `Comment discipline` policy ratified in the spec.
- The gate is operational in `bun run check` and rejects a planted
  breadcrumb comment.
- No breadcrumb comment remains in any in-scope tree.
- `guardrail` and `adversarial-spec-hardening` are archived under
  `plan/archive/`; `list-plan-threads` no longer lists them; no dangling
  reference remains anywhere in the tree.
- `bun run check` all-gates-ACTIVE green.
