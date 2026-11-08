---
proposal: this-repository-s-sessionstart-hook.md
decision: modify
revised_at: 2026-11-08T00:29:30Z
author_human: Chad Woolley <thewoolleyman@gmail.com>
author_llm: claude:gmktec-factory-placement
---

## Decision and Rationale

Accepted. It gives this repository's own SessionStart provisioner (.claude/hooks/ensure-plugins.ts, under non-functional-requirements.md §"Hooks") the rule livespec-dev-tooling spec v155 (livespec-dev-tooling#3734) states for the shared ensure-plugins: hold an installed orchestrator build whichever build is offered, install it when absent, and keep provisioning every other plugin. v155's rules cannot reach this repository, because its hook does not run that library. The fix item is li-z3ynyp. It deliberately mirrors only v155's Session reconcile and Absent install. It leaves out Broken install, the adopt step's command in the printed line, and the failed-fetch sentence. The topic name matches the slug the spec-change tier derives from the fix item's title (the homelab twin recorded `this-repository-s-sessionstart-hook`), so a spec-change tier record clears on ratification. AUTHORITY: filed and revised by the livespec-dev-tooling plan seat gmktec-factory-placement under legacy-coordinator-agent's R301 ruling of 2026-11-08 (session 8e04c5e0). The ruling was issued for homelab and said 'openbrain and resume get the same proposal under this same ruling'. Its basis, verbatim: Coordinator ruling (legacy-coordinator-agent, session 8e04c5e0, R301 plus the maintainer's 2026-08-26 "I authorize all revises"): option (a). You may file plugin-hook-holds-orchestrator-build and run its one-topic revise in a homelab worktree, through homelab's normal gates and a PR. Basis: the paragraph (CLAUDE.md about l.298, AGENTS.md l.341-347, dated 2026-08-27) requires spec work inside WORKER sessions of the foreman/worker model. That transport has been retired fleet-wide: the console plan's decisions D1, D4 and D5 retired tmux worker sessions, and dev-tooling applies that now. Homelab has no worker or seat in the roster, so read literally the paragraph means homelab can never revise at all. That is not its purpose, which was to stop ad-hoc work from bypassing the worker flow. A plan seat running the normal propose-change and revise path, with my answers to its pickers and the record kept, is today's equivalent of that flow. Your draft only mirrors ratified v155. REVIEW: an independent read-only sonnet reviewer blocked the first placement at 2026-11-08T00:16:53Z, as described under Modifications, and found NO BLOCKERS on these modified bytes at 2026-11-08T00:28:24Z.

## Modifications

The scenario is placed as `### Scenario: Session start holds the installed orchestrator build` at the end of non-functional-requirements.md §"Scenarios", not appended to scenarios.md. scenarios.md is unchanged. The first independent review blocked the proposed placement. scenarios.md's tail is inside "## Later-phase scenarios (non-load-bearing in phase 1)", whose scenarios MUST NOT be mapped to phase-1 tests. And this repository's §"Boundary" assigns contributor-workflow scenarios to non-functional-requirements.md. The §"Hooks" paragraph is unchanged from the proposal.

## Resulting Changes

- non-functional-requirements.md

## Ratification Review

ratification_review: auto-spawn
reviewer_model: sonnet
reviewer_identity: sonnet
separate_reviewer: True
read_only: True
reviewed_at: 2026-11-08T00:28:24Z
verdict: NO BLOCKERS
proposal_stem: this-repository-s-sessionstart-hook
content_digest: ab6ef5a705551039e2730e2a48dc710824fcda408bc02a5def3b7502443d329f
