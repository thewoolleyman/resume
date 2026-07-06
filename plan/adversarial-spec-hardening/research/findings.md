# Research — adversarial-spec-hardening

Design of record for the `plan/adversarial-spec-hardening/` thread. The
`handoff.md` beside this file is the entry point; this file is the *why*
and the *do-not-re-litigate* record. Read both before acting.

## Goal

Harden `SPECIFICATION/` to the point where an adversarial critique from a
*second* model surfaces **nothing but nits** — no load-bearing ambiguity,
contradiction, missing rule, or unenforced/under-defined guardrail. The
spec is "done enough" when the guardrail **contracts** are complete enough
to build the guardrail **harness** (see §"Exit criterion").

## Why an adversarial two-model loop

Single-author spec review has a blind spot: the author's own model of the
system is the same one that wrote the gaps. Alternating **critique** and
**revise** between two different model families (Claude and Codex) makes
each model's revision an adversarial check on the other's critique — the
reviser must accept/modify/reject the critic's findings on the record, and
the critic must survive the other model's scrutiny.

This is the guardrails-first discipline the project's seed
(`archive/livespec-seed.md`, "all discipline dials turned up to 11")
demands: the guardrails must be **defined and precise** before any product
code, because the first line of product code has to be written *under* them
(TDD gate, lint baseline, aggregate check, CI/PR discipline, memory hooks,
Result/ROP). Writing code without the guardrails defined and in place is the
bigger disaster, not spec precision.

## Exit criterion (when to stop hardening the spec)

NOT "when the critic runs out of things to say" (a precision loop has no
natural terminus) and NOT "when we start building the resume app." Stop when:

- a full adversarial critique turn surfaces **only nits** (wording, ordering,
  prose polish), AND
- the guardrail **contracts** (what each gate does, not every low-level
  realization) are complete enough to implement the guardrail **harness**.

The first real code is the **harness** — `bootstrap`, `bun run check`, the
red-green-replay commit-msg hook, the lint config, CI, the memory hook — not
the resume. Building the harness is simultaneously (a) putting the guardrails
in place and (b) the first real validator of the spec's guardrail definitions.
A few low-level realizations pinned as MUST today (exact script names,
`fast-check` specifically, the exact `TDD-*` trailer spellings) are the only
things that "diminishing returns" applies to — they get validated by building
the harness, via propose-change when reality disagrees, not by more critiquing.

## The loop (state machine)

Turn type is a pure function of `SPECIFICATION/` state; nothing is stored in
this plan.

- **Pending proposed change exists** (a non-`README.md` `*.md` under
  `SPECIFICATION/proposed_changes/`) → **REVISE** turn.
- **No pending proposed change** → **CRITIQUE** turn.

Who acts is fixed by two invariants:

1. **Adversarial:** the reviser is NEVER the critique's author. A pending
   change authored by `claude*` is revised by Codex; one authored by `codex*`
   is revised by Claude.
2. **Alternation:** the agent that just revised critiques next (it is the
   `author_llm` of the newest `history/vNNN/proposed_changes/*-revision.md`).

Those two produce exactly the maintainer-requested cadence:

```
claude critique → codex revise → codex critique → claude revise → (repeat)
```

`handoff.md` encodes the executable decision procedure. If the agent reading
the handoff is the wrong one for the current turn, it stops and tells the user
which agent to paste into.

## Standing rules (invariants for every turn)

- **Never capture impl gaps yet.** `post_step_skip_capture_impl_gaps: true` in
  `.livespec.jsonc` disables the revise post-step for both drivers. Do not file
  impl work-items in this loop; the repo is pre-implementation.
- **Always commit and land.** After every turn, stage + commit (Conventional
  Commit subject, per `AGENTS.md`) + push to `master`. Never ask about
  committing/pushing.
- **Ask when questionable.** Proceed autonomously on clear findings; ASK the
  maintainer before finalizing when a resolution has multiple valid directions,
  conflicts with the seed or a ratified decision, or would undo settled ground
  (below).
- **Whole-spec scope.** Critiques sweep the entire tree (`spec.md`,
  `contracts.md`, `constraints.md`, `scenarios.md`,
  `non-functional-requirements.md`), prioritizing load-bearing findings over
  style. Do not re-open settled decisions to manufacture findings.

## Settled — do NOT re-litigate (undoing these needs maintainer sign-off)

These were decided across v012–v015 with maintainer input. A critique may
refine their *edges*, but reversing them is a maintainer decision, not a loop
move:

- **TDD is `gate-enforced` via a standalone Bun/Vitest/Playwright adaptation of
  the fleet's `red_green_replay`** — checksummed `TDD-Red-*`/`TDD-Green-*`/
  `TDD-Suite-Green-*` commit-message trailers, per-commit commit-msg hook +
  `origin/master..HEAD` range validation. NOT a "process-enforced evidence
  record" (rejected in v014).
- **Multi-file TDD uses the fleet's proven single ANCHOR-test model** (verified
  in Python `livespec-dev-tooling` and Rust `livespec-console-beads-fabro`,
  e.g. commit `ad807ea`: 4 impl + 4 test files under one checksummed anchor):
  one anchor test staged alone + checksummed; impl and supporting/updated tests
  ride in the Green amend; supporting infra committed first via Suite-Green;
  pairing via commit-level co-staging + per-file coverage. NOT a reinvented
  "test-artifact-set checksum" (rejected in v015).
- **Property-based testing (`fast-check`) is the adopted TS adaptation of the
  seed's "fuzzing" dial**, with a reproducibility contract (seeds/replay, run
  counts, shrink capture, valid/malformed/adversarial/boundary generator
  classes).
- **Discipline-adoption inventory** with enforcement classes
  `gate-enforced | process-enforced | documented-only | none`; documentation
  alone never counts as enforcement.
- **PR path is fully gate-enforced before first impl merge**, reconciled with
  the **sanctioned direct-owner-commit path** via the on-push aggregate check
  (direct commits stay allowed; a red `master` is caught post-push).
- **Standalone boundary** (`constraints.md`): no runtime/check-time dependency
  on sibling livespec repos or the Python enforcement suite — adaptations are
  reimplemented locally in TS/Bun.

## Arc so far

- v012 — concrete non-functional gates.
- v013 — enforcement-class taxonomy; TDD *process-enforced* evidence gate;
  dev-tooling-inspired guideline enumeration; fuzzing→property-based adaptation
  (Codex revised a Claude critique).
- v014 — TDD upgraded to *gate-enforced* red-green-replay; ecosystem-tooling
  enumeration; memory-guardrail hook; pinned lint baseline (Claude revised a
  Codex critique).
- v015 — named MUST package-script surface; anchor-test correction to the
  red-green protocol; lint stack SHOULD→MUST; full PR gate-enforcement; fuzz
  reproducibility contract (Claude revised a Codex critique).

As of v015 the last reviser is **Claude**, so the next turn is a **Claude
critique** (see `handoff.md`).
