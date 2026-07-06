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

**0b. Phase.** Read **Current phase** from §"Where the loop stands now"
(`NF` or `FN`). It sets the critique **sweep scope**:
- `NF` → `SPECIFICATION/non-functional-requirements.md`.
- `FN` → `SPECIFICATION/spec.md`, `contracts.md`, `constraints.md`,
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
     <summary>`). Report: *"Revised → vNNN (phase `<NF|FN>`). Next: a CRITIQUE by
     me — paste this handoff into `ME` again."*

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
       `ME`), then **commit + push** (`docs(spec): critique <topic>`). Report:
       *"Critique filed → <file> (phase `<NF|FN>`). Next: a REVISE by the OTHER
       agent — paste this handoff into `{other}`."*
     - **If ONLY nits remain → phase branch:**
       - **Phase `NF`:** do NOT file a critique. **Advance the phase to `FN`:**
         edit this handoff's §"Where the loop stands now" to `Current phase: FN`,
         add a one-line note to findings.md §"Arc so far", then **commit + push**
         (`docs(plan): advance adversarial-spec-hardening to functional phase`).
         Report: *"Phase NF converged (only nits). Advanced to FN. Next: my (same
         agent) FN critique — re-paste this handoff into `ME`."* (You remain the
         last reviser, so the next critique is still yours.)
       - **Phase `FN`:** the spec is converged. Do NOT file a critique. Perform
         the **Terminal step** below.

## Terminal step (Phase FN converged → create `plan/guardrail`)

The spec is hardened. Create the next plan in the chain and hand off (do NOT
start implementing here):

1. Scaffold `plan/guardrail/research/findings.md` and `plan/guardrail/handoff.md`
   (same convention as this thread). `plan/guardrail` MUST:
   - Drive the **initial guardrail harness** — `bootstrap`, `bun run check`, the
     red-green-replay commit-msg hook + `TDD-Intent` grammar, lint/TS config,
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

## Where the loop stands now

Current phase: **NF** (non-functional hardening).
Latest version **v017**; last reviser **Claude**; `proposed_changes/` empty.
→ The next turn is a **Claude critique** of `non-functional-requirements.md`
(Phase NF scope). **Start by pasting this handoff path into Claude Code.**

## Resume

Paste this into Claude Code or Codex:

```
plan/adversarial-spec-hardening/handoff.md
```
