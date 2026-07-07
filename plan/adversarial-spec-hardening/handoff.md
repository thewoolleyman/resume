# Handoff — adversarial-spec-hardening (resume)

**Thread:** `plan/adversarial-spec-hardening/` · **Driver-agnostic:** paste
this file's path into **either Claude Code or Codex**; it self-determines the
turn from `SPECIFICATION/` state (plus the recorded **phase**) and tells you if
you are the wrong agent.

> Turn (critique vs revise) and actor are **derived from `SPECIFICATION/`
> state**. The one piece of non-derivable state is the **phase** (NF → FN),
> recorded in §"Where the loop stands now" and advanced only by the procedure
> below.

## Read first

1. `plan/adversarial-spec-hardening/research/findings.md` — the design of
   record: goal, the **plan chain** (this thread → `plan/guardrail` →
   `plan/mvp`), the two hardening phases, the exit criterion, the standing
   rules, and the **Settled — do NOT re-litigate** list. Read it before you
   critique or revise so you neither reinvent nor undo settled ground.

## What this thread is

Run adversarial turns of Claude and Codex critiquing and revising the livespec
spec until an adversarial critique surfaces **nothing but nits**, in **two
ordered phases** — **NF** (non-functional: `non-functional-requirements.md`)
then **FN** (functional: `spec.md`, `contracts.md`, `constraints.md`,
`scenarios.md`) — and then **create `plan/guardrail`** and hand off. The reviser
is always the *other* model from the critique's author. Cadence within a phase:

```
claude critique → codex revise → codex critique → claude revise → (repeat)
```

## Do exactly ONE turn (decision procedure)

**0. Identity.** If you are Claude Code → `ME = claude` (author
`claude-opus-4-8`). If you are Codex → `ME = codex` (author `codex-gpt-5`).
Family match is by prefix: `claude*` → claude, `codex*` → codex.

**0b. Phase.** Read **Current phase** from §"Where the loop stands now".
The machine codes are `NF` and `FN`, but when talking to a human ALWAYS pair
the code with its plain-English meaning and file scope:
- `NF` = non-functional/process hardening →
  `SPECIFICATION/non-functional-requirements.md`.
- `FN` = functional/product hardening →
  `SPECIFICATION/spec.md`, `contracts.md`, `constraints.md`,
  `scenarios.md`.

**1. Detect state.** Count pending proposed changes:
`ls SPECIFICATION/proposed_changes/` → every `*.md` that is NOT `README.md`.

**2a. A pending change EXISTS → REVISE turn.**
   - Read its front-matter `author:` → its family = `AUTHOR`.
   - **If `AUTHOR == ME`:** STOP — revising your own critique isn't adversarial.
     Tell the maintainer: *"This is a REVISE of my own critique; paste this
     handoff into the OTHER agent (`{codex if ME==claude else claude}`)."* Do
     nothing else.
   - **If `AUTHOR != ME`:** run **`/livespec:revise`**. Process every `## Proposal`
     (accept / modify / reject, each with a rationale); author yourself as `ME`.
     Honor the standing rules: **skip capture-impl-gaps** (already disabled in
     `.livespec.jsonc`), **ask the maintainer** on anything questionable, and do
     NOT undo the **Settled** list without sign-off. Let the CLI cut `vNNN` and
     run its doctor post-steps. Then **commit + push** (`chore(spec): cut vNNN —
     <summary>`). Report with the phase code AND human-readable scope, e.g.
     *"Revised → vNNN (Phase `<NF|FN>` — `<non-functional/process hardening of
     non-functional-requirements.md | functional/product hardening of spec.md,
     contracts.md, constraints.md, scenarios.md>`). Next: a CRITIQUE by me —
     paste this handoff into `ME` again."*

**2b. NO pending change → CRITIQUE turn.**
   - Read the newest `SPECIFICATION/history/vNNN/proposed_changes/*-revision.md`
     front-matter `author_llm:` → its family = `LAST_REVISER`.
   - **If `LAST_REVISER != ME`:** STOP. Tell the maintainer: *"The next critique
     belongs to `LAST_REVISER`; paste this handoff into that agent."*
   - **If `LAST_REVISER == ME`:** sweep the **current phase's files** (per step
     0b) for **load-bearing** issues only — ambiguity, contradiction,
     missing/weak enforcement, behavior with no clause or scenario. Defer
     wording/ordering/style. Do NOT sweep out-of-phase files.
     - **If ≥ 1 load-bearing finding:** run **`/livespec:critique`** (author =
       `ME`), then **commit + push** (`docs(spec): critique <topic>`). Report
       with the phase code AND human-readable scope, e.g.
       *"Critique filed → <file> (Phase `<NF|FN>` — `<non-functional/process
       hardening of non-functional-requirements.md | functional/product
       hardening of spec.md, contracts.md, constraints.md, scenarios.md>`). Next:
       a REVISE by the OTHER agent — paste this handoff into `{other}`."*
     - **If ONLY nits remain → phase branch:**
       - **Phase `NF`:** do NOT file a critique. **Advance the phase to `FN`:**
         edit this handoff's §"Where the loop stands now" to `Current phase: FN`,
         add a one-line note to findings.md §"Arc so far", then **commit + push**
         (`docs(plan): advance adversarial-spec-hardening to functional phase`).
         Report: *"Phase NF — non-functional/process hardening of
         `non-functional-requirements.md` — converged (only nits). Advanced to
         Phase FN — functional/product hardening of `spec.md`, `contracts.md`,
         `constraints.md`, and `scenarios.md`. Next: my functional-spec critique
         of those four files — re-paste this handoff into `ME`."* (You remain the
         last reviser, so the next critique is still yours.)
       - **Phase `FN`:** the spec is converged. Do NOT file a critique. Perform
         the **Terminal step** below.

## Terminal step (Phase FN — functional/product hardening — converged → create `plan/guardrail`)

The spec is hardened. Create the next plan in the chain and hand off (do NOT
start implementing here):

1. Scaffold `plan/guardrail/research/findings.md` and `plan/guardrail/handoff.md`
   (same convention as this thread). `plan/guardrail` MUST:
   - Drive the **initial guardrail harness** — `bootstrap`, `bun run check`, the
     red-green-replay commit-msg hook + content-triggered TDD trailer grammar, lint/TS config,
     `.github/workflows/check.yml` + `auto-enable-merge.yml` + branch protection,
     the memory-guardrail hook, Result/ROP + coverage + property + scenario gates
     — **provisioned additively** per `non-functional-requirements.md`
     §"Guardrail provisioning boundary" (each gate enforced from its introducing
     commit; all green as the precondition of the first `src/**` product merge).
   - Be **driveable in EITHER Claude or Codex**, via the **`needs-attention`**
     (triage) + **`drive`** (execute-one-action) operator surface plus the
     git-jsonl `next` / `implement` skills (see findings.md §"Operator surface").
   - Make its **last step** create `plan/mvp` and hand off.
2. Note that `plan/mvp` will drive **git-jsonl gap detection + ordering** for the
   **searchable + static-text MVP only** (no AI, no MCP), via `detect-impl-gaps`
   / `capture-impl-gaps` → `next` / `implement`, and that
   `post_step_skip_capture_impl_gaps` in `.livespec.jsonc` flips back to `false`
   when `plan/mvp` begins.
3. **Commit + push** (`docs(plan): converge spec; create plan/guardrail`).
   Report: *"CONVERGED — both hardening phases found only nits. `plan/guardrail`
   created; adversarial-spec-hardening is complete. Drive `plan/guardrail` next
   (Claude or Codex)."* and STOP this thread.

## Standing rules (every turn — full text in findings.md)

- **Never capture impl gaps yet** — `post_step_skip_capture_impl_gaps: true`
  (gap capture is `plan/mvp`'s job, after the guardrails are live).
- **Always commit and land** to `master`; never ask about committing/pushing.
- **Ask the maintainer** before finalizing anything questionable (multiple valid
  directions, conflict with the seed or a ratified decision, or undoing a
  **Settled** item).
- **Phase-scoped sweep** — finish NF before opening FN; never critique
  out-of-phase files.
- **Human-readable communication.** NEVER talk to the maintainer using only an
  opaque phase code, work-item id, action id, version id, or other machine token.
  Always pair the token with a human-readable description of what it means and
  what files, behavior, proposal, or task it refers to. Examples: say "Phase FN
  — functional/product hardening of `spec.md`, `contracts.md`, `constraints.md`,
  and `scenarios.md`", not just "Phase FN"; say "`impl:123` — add the searchable
  resume index gate", not just "`impl:123`".

## Convergence guardrails (READ before any coverage/TDD critique)

Two areas caused repeated critique/revise thrashing and were **converged by
maintainer ratification at v020**. Every critique pass — Claude or Codex — is
bound by these:

- **Coverage is a flat, non-negotiable 100%.** First-party `src/**` product
  source MUST be 100% line and 100% branch. No tiers, no framework-glue
  exemption, no per-module carve-outs, no tunable percentages. Well-factored,
  loosely coupled, highly cohesive code with dependency injection and module
  mocking makes 100% always achievable at the unit level. Do NOT reintroduce
  floors/tiers or propose "coverage exceptions."

- **The TDD gate is content-triggered — and it is a transcription of the fleet.**
  `non-functional-requirements.md` §"Mechanically enforced Red -> Green commit
  protocol" is a **faithful standalone transcription** of the livespec fleet's
  proven `red_green_replay` commit-msg gate
  (`/data/projects/livespec-dev-tooling/livespec_dev_tooling/checks/red_green_replay.py`
  and its sibling `_red_green_replay_modes.py`). The spec states it as our own
  standalone rules and **MUST NOT reference the fleet** — this provenance lives
  here only. The model: the leg is selected by the staged buckets (first-party
  product source vs test files) + HEAD trailer state; no `TDD-Intent` marker; the
  subject prefix never rejects a commit for containing product code; commits
  staging neither product source nor tests pass immediately with no leg; the
  Suite-Green leg runs the FULL suite in the hook; a branch-range gate validates
  `origin/master..HEAD`. **Do NOT re-derive or re-design this mechanism.** If a
  critique believes the spec diverges from the fleet's actual behavior, the fix
  is to **conform the spec to the fleet** (confirmed by reading those two files,
  and ultimately by building the harness in `plan/guardrail`) — never to invent a
  new variant. Low-level realizations (exact trailer spellings, which check runs
  in the commit-msg hook vs. the range validation, cold-start ordering of test
  infrastructure) are validated when the harness is built in `plan/guardrail` via
  propose-change, **not** by more spec critique.

- **Critique-justification requirement.** A critique pass MUST NOT file a
  coverage or TDD-mechanism finding unless its `motivation` explicitly justifies
  (a) that it is not re-litigating either converged decision above, (b) that it
  is not a low-level realization deferred to `plan/guardrail`, and (c) the
  concrete failure the ambiguity would cause. A finding that cannot clear this
  bar is out of scope; **prefer advancing the phase over manufacturing a
  coverage/TDD finding.** If a full NF sweep surfaces only such can't-justify
  items on coverage/TDD (and only nits elsewhere), treat Phase NF —
  non-functional/process hardening of `non-functional-requirements.md` — as
  converged and advance per the decision procedure.

## Where the loop stands now

Current phase: **FN** (functional/product hardening of `SPECIFICATION/spec.md`,
`contracts.md`, `constraints.md`, and `scenarios.md`).
Latest version **v020** — a **maintainer-directed reset** authored + landed by
Claude (coverage -> non-negotiable 100%; TDD -> standalone content-triggered gate;
reverses Settled v016/v017). `proposed_changes/` empty.
→ Codex completed the explicit post-v020 NF critique override — the
non-functional/process hardening review of `non-functional-requirements.md` —
and found only nits, so Phase NF is converged. Because that phase advance
happened during the v020 reset override rather than after a normal Codex revise,
the next turn is a **Codex critique of the functional/product specification
files**: `SPECIFICATION/spec.md`, `contracts.md`, `constraints.md`, and
`scenarios.md`.
Read the **Convergence guardrails** above first, then **paste this handoff path
into Codex**. Normal critique↔revise alternation resumes after the Codex
functional-spec critique is filed or after Phase FN — functional/product
hardening — converges.

## Resume

Paste this into Claude Code or Codex:

```
plan/adversarial-spec-hardening/handoff.md
```
