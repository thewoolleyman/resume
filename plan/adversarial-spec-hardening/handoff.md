# Handoff — adversarial-spec-hardening (resume)

**Thread:** `plan/adversarial-spec-hardening/` · **Driver-agnostic:** paste
this file's path into **either Claude Code or Codex**; it self-determines the
turn from `SPECIFICATION/` state and tells you if you are the wrong agent.

> Status is **derived from `SPECIFICATION/` state**, never stored here.
> Turn = REVISE if a pending proposed change exists, else CRITIQUE. Who acts
> is fixed by the adversarial + alternation invariants below.

## Read first

1. `plan/adversarial-spec-hardening/research/findings.md` — the design of
   record: goal, exit criterion, the state machine, the standing rules, and
   the **Settled — do NOT re-litigate** list. Read it before you critique or
   revise so you neither reinvent nor undo settled ground.

## What this thread is

Run adversarial turns of Claude and Codex critiquing and revising the livespec
spec until an adversarial critique surfaces **nothing but nits**. The reviser
is always the *other* model from the critique's author, giving each revision an
adversarial check. Cadence (a consequence of the invariants, not a script):

```
claude critique → codex revise → codex critique → claude revise → (repeat)
```

## Do exactly ONE turn (decision procedure)

**0. Identity.** If you are Claude Code → `ME = claude` (author
`claude-opus-4-8`). If you are Codex → `ME = codex` (author `codex-gpt-5`).
Family match is by prefix: `claude*` → claude, `codex*` → codex.

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
     `.livespec.jsonc`), **ask the maintainer** on anything questionable (per
     findings §"Standing rules"), and do NOT undo the **Settled** list without
     sign-off. Let the CLI cut `vNNN` and run its doctor post-steps. Then
     **commit + push** the cut (`chore(spec): cut vNNN — <summary>`). Report:
     *"Revised → vNNN. Next: a CRITIQUE by me — paste this handoff into `ME`
     again (the reviser critiques next)."*

**2b. NO pending change → CRITIQUE turn.**
   - Read the newest `SPECIFICATION/history/vNNN/proposed_changes/*-revision.md`
     front-matter `author_llm:` → its family = `LAST_REVISER`.
   - **If `LAST_REVISER != ME`:** STOP. Tell the maintainer: *"The next critique
     belongs to `LAST_REVISER`; paste this handoff into that agent."*
   - **If `LAST_REVISER == ME`:** sweep the **whole** spec tree (`spec.md`,
     `contracts.md`, `constraints.md`, `scenarios.md`,
     `non-functional-requirements.md`) for **load-bearing** issues only —
     ambiguity, contradiction, missing/weak enforcement, behavior with no
     clause or scenario. Defer wording/ordering/style.
     - **If ≥ 1 load-bearing finding:** run **`/livespec:critique`** (author =
       `ME`), then **commit + push** (`docs(spec): critique <topic>`). Report:
       *"Critique filed → <file>. Next: a REVISE by the OTHER agent — paste this
       handoff into `{other}`."*
     - **If ONLY nits remain:** do NOT file a critique. Report:
       *"CONVERGED — an adversarial sweep found only nits. The loop is complete;
       the guardrail contracts are ready to build the harness (see findings
       §Exit criterion)."* and STOP the loop.

## Standing rules (every turn — full text in findings.md)

- **Never capture impl gaps yet** — `post_step_skip_capture_impl_gaps: true`.
- **Always commit and land** to `master`; never ask about committing/pushing.
- **Ask the maintainer** before finalizing anything questionable (multiple
  valid directions, conflict with the seed or a ratified decision, or undoing
  a **Settled** item).

## Where the loop stands now

Latest version **v015**; last reviser **Claude**; `proposed_changes/` empty.
→ The next turn is a **Claude critique**. **Start by pasting this handoff path
into Claude Code.**

## Resume

Paste this into Claude Code or Codex:

```
plan/adversarial-spec-hardening/handoff.md
```
