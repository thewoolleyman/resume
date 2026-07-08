# Research — adversarial-spec-hardening

Design of record for the `plan/adversarial-spec-hardening/` thread. The
`handoff.md` beside this file is the executable entry point; this file is the
*why* and the *do-not-re-litigate* record. Read both before acting.

## Goal

Harden `SPECIFICATION/` to the point where an adversarial critique from a
*second* model surfaces **nothing but nits** — no load-bearing ambiguity,
contradiction, missing rule, or unenforced/under-defined guardrail — and then
**hand the hardened spec off to the implementation plan chain** that builds it.
Hardening runs in **two ordered phases** (non-functional first, then
functional); convergence of the second phase is the trigger to create the
downstream `plan/guardrail` plan (see §"The plan chain").

## Why an adversarial two-model loop

Single-author spec review has a blind spot: the author's own model of the
system is the same one that wrote the gaps. Alternating **critique** and
**revise** between two different model families (Claude and Codex) makes each
model's revision an adversarial check on the other's critique — the reviser
must accept/modify/reject the critic's findings on the record, and the critic
must survive the other model's scrutiny.

This is the guardrails-first discipline the project's seed
(`archive/livespec-seed.md`, "all discipline dials turned up to 11") demands:
the guardrails must be **defined and precise** before any product code, because
the first line of product code has to be written *under* them (TDD gate, lint
baseline, aggregate check, CI/PR discipline, memory hooks, Result/ROP). Writing
code without the guardrails defined and in place is the bigger disaster, not
spec precision.

## The plan chain (this thread's place in it)

The maintainer's ratified sequencing is a **chain of livespec plans**, each
handing off to the next. Ordering the work this way is what makes guardrail
provisioning **additive rather than circular** — see §"Settled".

1. **`plan/adversarial-spec-hardening` (this thread).** Two hardening phases:
   - **Phase NF — non-functional/process hardening.** Critique/revise scope is
     `SPECIFICATION/non-functional-requirements.md`.
   - **Phase FN — functional/product hardening.** After Phase NF —
     non-functional/process hardening of `non-functional-requirements.md` —
     converges (an adversarial critique of the non-functional/process file finds
     only nits), the loop advances and its scope becomes the
     **functional/product** files: `spec.md`, `contracts.md`, `constraints.md`,
     `scenarios.md`.
   - **Terminal.** When Phase FN — functional/product hardening of `spec.md`,
     `contracts.md`, `constraints.md`, and `scenarios.md` — converges, this
     thread's final act is to create `plan/guardrail/` (below) and hand off.
     adversarial-spec-hardening is then **done**.

2. **`plan/guardrail` (created at this thread's terminal step).** Drives the
   **initial guardrail harness implementation** — `bootstrap`, `bun run check`,
   the red-green-replay commit-msg hook, the lint/TS config, CI + PR automation,
   the memory-guardrail hook — provisioned **additively** per
   `non-functional-requirements.md` §"Guardrail provisioning boundary". It is
   **driveable in EITHER Claude or Codex**. Its **last step** creates
   `plan/mvp` (below) and hands off.

3. **`plan/mvp` (created at `plan/guardrail`'s last step).** Drives **gap
   detection and ordering, via beads-fabro**, for the currently-specified **MVP**:
   the interactive **searchable** resume plus the **static-text** resume — and
   **only** those. Deferred AI-driven mode and the MCP server are explicitly
   **out of MVP scope** (they remain later-phase per `spec.md` §"Delivery
   phases"). It uses the beads-fabro orchestrator's `detect-impl-gaps` /
   `capture-impl-gaps` to find and file spec→impl gaps as work-items, orders
   them so each lands additively under the now-live guardrails, and drives them
   Red→Green via `next` / `implement`.

### Operator surface: `drive` + `needs-attention`

`plan/guardrail` and `plan/mvp` are driven through livespec's operator
surface — the **`needs-attention`** and **`drive`** skills/commands:

- **`needs-attention`** composes spec-side, impl-side, human-valve, plan-thread,
  and hygiene "gather" primitives into one attention list — the single triage
  view of what the project needs next across the spec and the beads store.
- **`drive --action <action-id>`** executes exactly one action (dispatch an impl
  work-item, approve/accept/reject a valve, adjust policy). It is the executor;
  it does not plan or rank.

The operator loop is therefore: run `needs-attention` → pick the ripe action →
`drive --action <id>` → repeat. These are the surface `plan/guardrail` and
`plan/mvp` MUST specify their day-to-day driving against. They ship in the
`livespec-orchestrator-beads-fabro` orchestrator — this project's configured
orchestrator, per `.livespec.jsonc` `implementation.plugin =
livespec-orchestrator-beads-fabro` — which also ships `plan`, `next`,
`implement`, `capture-work-item`, and `list-work-items`, so the downstream
plans drive their day-to-day work via this full operator loop now.

## Exit criterion (when each phase and this thread stop)

NOT "when the critic runs out of things to say" (a precision loop has no natural
terminus) and NOT "when we start building the resume app." Instead:

- **Phase NF — non-functional/process hardening — ends** when a full adversarial
  critique of `non-functional-requirements.md` surfaces **only nits**. The loop
  then **advances to Phase FN — functional/product hardening of `spec.md`,
  `contracts.md`, `constraints.md`, and `scenarios.md`** — it does not stop.
- **Phase FN — functional/product hardening — ends** when a full adversarial
  critique of the functional files (`spec.md`, `contracts.md`,
  `constraints.md`, `scenarios.md`) surfaces **only nits**, AND the guardrail
  **contracts** are complete enough to implement the guardrail **harness**.
- **This thread ends** when Phase FN — functional/product hardening — has ended
  and `plan/guardrail/` has been created and handed off.

A few low-level realizations pinned as MUST today (exact script names,
`fast-check` specifically, the exact `TDD-*` trailer spellings, the concrete
coverage-floor percentages) are the only things "diminishing returns" applies
to — they get validated by building the harness in `plan/guardrail`, via
propose-change when reality disagrees, not by more critiquing.

## The loop (state machine)

Turn type is a pure function of `SPECIFICATION/` state; **phase** is the one
piece of genuinely non-derivable state and is recorded in `handoff.md`
(§"Where the loop stands now"). Everything else is derived.

- **Pending proposed change exists** (a non-`README.md` `*.md` under
  `SPECIFICATION/proposed_changes/`) → **REVISE** turn.
- **No pending proposed change** → **CRITIQUE** turn, whose sweep scope is the
  **current phase's files** (NF: the non-functional file; FN: the functional
  files).

Who acts is fixed by two invariants (unchanged across both phases):

1. **Adversarial:** the reviser is NEVER the critique's author. A pending change
   authored by `claude*` is revised by Codex; one authored by `codex*` is
   revised by Claude.
2. **Alternation:** the agent that just revised critiques next (it is the
   `author_llm` of the newest `history/vNNN/proposed_changes/*-revision.md`).

Those two produce the maintainer-requested cadence within each phase:

```
claude critique → codex revise → codex critique → claude revise → (repeat)
```

**Phase advancement** happens on a critique turn: if the current phase's sweep
finds only nits and the phase is NF — non-functional/process hardening of
`non-functional-requirements.md` — the critic records the advance to FN —
functional/product hardening of `spec.md`, `contracts.md`, `constraints.md`,
and `scenarios.md` — (updates `handoff.md` + this file's Arc, commits) and
stops for that turn. The same agent (still the last reviser) opens the
functional/product hardening phase with its next critique. If the phase is FN
and its sweep finds only nits, the critic performs the **terminal step** (create
`plan/guardrail/`) instead of filing a critique.

`handoff.md` encodes the executable decision procedure, including which agent
must act and the phase-advancement / terminal branches.

## Standing rules (invariants for every turn)

- **Never capture impl gaps yet.** `post_step_skip_capture_impl_gaps: true` in
  `.livespec.jsonc` disables the revise post-step for both drivers. Do not file
  impl work-items in this thread; gap capture is `plan/mvp`'s job, after the
  guardrails are live. Flip the config back only when `plan/mvp` begins.
- **Always commit and land.** After every turn, stage + commit (Conventional
  Commit subject, per `AGENTS.md`) + push to `master`. Never ask about
  committing/pushing.
- **Ask when questionable.** Proceed autonomously on clear findings; ASK the
  maintainer before finalizing when a resolution has multiple valid directions,
  conflicts with the seed or a ratified decision, or would undo settled ground
  (below).
- **Phase-scoped sweep.** A critique sweeps the **current phase's** files,
  prioritizing load-bearing findings over style. Do not re-open settled
  decisions to manufacture findings, and do not critique out-of-phase files
  (finish NF before opening FN).
- **Human-readable communication.** NEVER talk to the maintainer using only an
  opaque phase code, work-item id, action id, version id, or other machine token.
  Always pair the token with a human-readable description of what it means and
  what files, behavior, proposal, or task it refers to. Examples: say "Phase FN
  — functional/product hardening of `spec.md`, `contracts.md`, `constraints.md`,
  and `scenarios.md`", not just "Phase FN"; say "`impl:123` — add the searchable
  resume index gate", not just "`impl:123`".
- **Coverage & TDD are converged — justify or defer.** The non-negotiable 100%
  coverage rule and the content-triggered TDD gate are ratified (v020). A
  critique MUST NOT file a coverage or TDD-mechanism finding unless its
  `motivation` first justifies why the point is genuinely load-bearing and is
  NOT (a) re-litigating those settled rules, nor (b) a low-level realization
  deferred to `plan/guardrail` (exact trailer spellings, commit-hook-vs-range
  timing, and the like). See the **convergence guardrails** in `handoff.md`.

## Settled — do NOT re-litigate (undoing these needs maintainer sign-off)

These were decided across v012–v017 with maintainer input. A critique may refine
their *edges*, but reversing them is a maintainer decision, not a loop move:

- **The plan chain and MVP scope.** adversarial-spec-hardening → `plan/guardrail`
  → `plan/mvp`, in that order; Phase NF — non-functional/process hardening —
  before Phase FN — functional/product hardening. The MVP is the
  **searchable interactive + static-text** resume only; **AI mode and the MCP
  server are out of MVP scope** and stay later-phase.
- **Guardrail provisioning is additive, not a bootstrap-mode flag.** The
  "first non-trivial implementation merge" is the first `src/**` product-source
  merge; the harness is provisioned additively ahead of it (each gate enforced
  from its introducing commit; all green as a precondition of that merge). No
  spec-level bootstrap-mode window and no self-hosting-from-commit-1 rule. The
  maintainer rejected the chicken-and-egg framing: correct additive ordering,
  owned by `plan/guardrail`, keeps the build additive rather than circular
  (`non-functional-requirements.md` §"Guardrail provisioning boundary").
- **TDD is `gate-enforced` via a standalone Bun/Vitest/Playwright commit-msg
  gate that is CONTENT-TRIGGERED** — the leg is selected by the staged buckets
  (first-party `src/**` product source vs test files) plus the repository's HEAD
  trailer state, NOT by an explicit intent marker and NOT by the commit subject
  prefix. Checksummed `TDD-Red-*`/`TDD-Green-*`/`TDD-Suite-Green-*` trailers; a
  singular anchor-test checksum; a per-commit commit-msg hook +
  `origin/master..HEAD` range validation; the Suite-Green leg runs the FULL
  suite in the hook; commits staging neither product source nor tests pass
  immediately with no leg. NOT a "process-enforced evidence record" (rejected
  v014). **v020 reset (maintainer-directed) REVERSED** the v016 explicit
  `TDD-Intent` discriminator and the "leg selection is NOT the subject prefix"
  framing; the spec now states the proven content-triggered model as its own
  standalone rules. Provenance — that this is a faithful transcription of the
  livespec fleet's `red_green_replay` commit-msg gate
  (`livespec-dev-tooling/.../checks/red_green_replay.py` +
  `_red_green_replay_modes.py`) — lives ONLY here and in `handoff.md`, **never
  in the spec**. Do NOT re-derive or re-design this mechanism; where it diverges
  from the fleet, conform to the fleet (validated by building the harness in
  `plan/guardrail`), do not reinvent.
- **Multi-file TDD uses the fleet's proven single ANCHOR-test model** (verified
  in Python `livespec-dev-tooling` and Rust `livespec-console-beads-fabro`): one
  anchor test staged alone + checksummed; impl and supporting/updated tests ride
  in the Green amend; supporting infra committed first via Suite-Green; pairing
  via commit-level co-staging + per-file coverage. NOT a "test-artifact-set
  checksum" (rejected v015). **First-party product source** = repository-authored
  `src/**` implementation; harness/tooling, specs, docs, tests, generated
  artifacts, lockfiles, and `data/**` snapshots are OUT of the product-source
  pairing/range gates (settled v016).
- **Property-based testing (`fast-check`)** is the adopted TS adaptation of the
  seed's "fuzzing" dial, with a reproducibility contract (seeds/replay, run
  counts, shrink capture, valid/malformed/adversarial/boundary generator
  classes).
- **Scenario coverage has two mapping classes** (settled v017): browser-
  observable scenarios require a Playwright mapping; non-browser-exercisable
  scenarios (data/build/tooling invariants) require a named non-Playwright
  category mapping + rationale. The classification applies to the existing
  phase-1 scenario set, and `check:scenarios` rejects class-dodging.
- **Discipline-adoption inventory** with enforcement classes
  `gate-enforced | process-enforced | documented-only | none`; documentation
  alone never counts as enforcement.
- **PR path is fully gate-enforced before first impl merge**, reconciled with
  the **sanctioned direct-owner-commit path** via the on-push aggregate check.
- **Coverage is a non-negotiable 100%** line and branch for first-party `src/**`
  product source (**v020 reset, maintainer-directed; REVERSES the v017 tiered
  non-trivial-floor decision**). No core/glue tiers, no glue exemption, no
  per-module carve-out, no tunable percentages: well-factored + loosely coupled
  + highly cohesive code with dependency injection + module mocking makes 100%
  always achievable at the unit level. Generated artifacts and harness/tooling
  are outside the product-source set and are not counted.
- **Standalone boundary** (`constraints.md`): no runtime/check-time dependency on
  sibling livespec repos or the Python enforcement suite — adaptations are
  reimplemented locally in TS/Bun.

## Arc so far

- v012 — concrete non-functional gates.
- v013 — enforcement-class taxonomy; TDD *process-enforced* evidence gate;
  dev-tooling-inspired guideline enumeration; fuzzing→property-based adaptation
  (Codex revised a Claude critique).
- v014 — TDD upgraded to *gate-enforced* red-green-replay; ecosystem-tooling
  enumeration; memory-guardrail hook; pinned lint baseline (Claude revised).
- v015 — named MUST package-script surface; anchor-test correction; lint MUST;
  full PR gate-enforcement; fuzz reproducibility contract (Claude revised).
- v016 — Codex revised a Claude critique: resolved leg-selection via `TDD-Intent`;
  scoped the pairing gate for Suite-Green; defined first-party product source
  (`src/**`, harness excluded).
- v017 — Claude revised a Codex critique: two-class scenario coverage mapping;
  pinned the `TDD-Intent` trailer grammar for the amended commit; added the
  additive §"Guardrail provisioning boundary" (per the maintainer's
  additive-ordering direction); pinned non-trivial coverage floors.
- v018 — Codex revised a Claude critique: restored the local-memory scenario
  heading, aligned package-script scenario coverage wording with the two-class
  mapping, and clarified Suite-Green support-infrastructure commits.
- v019 — Claude revised a Codex critique: named the integration-test script
  contract (`test:integration` in the required Bun script surface, with a
  documented pass-with-no-tests equivalent).
- v020 — **Maintainer-directed reset** (Claude authored + landed, OUTSIDE the
  adversarial alternation, reversing Settled ground with maintainer sign-off, to
  stop repeated coverage/TDD thrashing): coverage flattened to a non-negotiable
  **100% line+branch** for first-party `src/**`; the TDD gate rewritten as a
  standalone **content-triggered** protocol (the invented `TDD-Intent`
  discriminator and `test-support-genesis` allowance removed), capturing the
  fleet's proven `red_green_replay` model as our own standalone rules with no
  fleet reference in the spec. Added the **convergence guardrails** +
  critique-justification requirement to `handoff.md`.
- Post-v020 NF convergence — Codex performed the explicit adversarial critique
  override of the v020 reset and found only nits in
  `non-functional-requirements.md`; Phase NF (non-functional/process hardening)
  advanced to Phase FN (functional/product hardening of `spec.md`,
  `contracts.md`, `constraints.md`, and `scenarios.md`).

- v021 — Claude revised a Codex functional/product critique by pinning stable
  item-anchor composition and present-end date rendering.
- v022 — Codex revised a Claude functional/product critique by pinning inline
  code span rendering and bare URL autolinking against the hash-pinned
  predecessor production source and renderer behavior.
- Terminal Phase FN convergence — Codex performed the final functional/product
  hardening sweep of `spec.md`, `contracts.md`, `constraints.md`, and
  `scenarios.md` and found no new load-bearing ambiguity, contradiction,
  missing rule, or missing scenario. Remaining observations were nits or
  implementation-realization details. `plan/guardrail/` was created as the next
  plan in the chain, and `plan/adversarial-spec-hardening` is complete.
