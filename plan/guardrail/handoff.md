# Handoff - guardrail harness

**Thread:** `plan/guardrail/` - **Driver-agnostic:** paste this file's path into
either Claude Code or Codex. The goal is to build the initial repository
guardrail harness before any first-party product source under `src/**` lands.

## Read first

1. `plan/guardrail/research/findings.md` - goal, source-of-truth sections,
   work-slice order, completion criteria, and operator surface.
2. `SPECIFICATION/non-functional-requirements.md` - authoritative guardrail
   requirements.
3. `plan/adversarial-spec-hardening/research/findings.md` only if you need the
   historical rationale for why this plan follows spec hardening.

## What this thread is

This plan provisions the initial guardrail harness:

- `bootstrap` and the required Bun script surface.
- `bun run check` as the aggregate non-mutating quality gate.
- Strict TypeScript, Svelte, lint, format, and build validation.
- The content-triggered Red -> Green commit-msg hook, branch-range validation,
  trailer grammar, anchor-test checksum verification, and `tdd-commit` helper.
- Local memory guardrails and `.ai/discipline-adoption.md`.
- GitHub CI, pull-request auto-merge workflow, and branch-protection/settings
  verification.
- Result/ROP, 100% line and branch coverage for first-party `src/**` product
  source, property/fuzz, and scenario-mapping gates.

This plan does NOT implement the resume product. It prepares the repo so the
product MVP can be implemented under the required discipline.

## Do exactly one action

Use the operator surface when available:

1. Run `needs-attention` - triage the next actionable item across spec,
   implementation, human-valve, and hygiene state.
2. Run `drive --action <action-id>` - execute exactly one selected action.
3. Commit and push the coherent result to `master`.

Fallback while git-jsonl does not expose the full operator surface:

1. If guardrail work items already exist, run the livespec-orchestrator-git-jsonl
   `next` skill to pick the most-ripe guardrail item, then run
   livespec-orchestrator-git-jsonl `implement` for that one item.
2. If no guardrail work items exist, seed work items from
   `plan/guardrail/research/findings.md` section "Work slices" using
   livespec-orchestrator-git-jsonl `capture-work-item`. Seed small,
   dependency-ordered items with human-readable titles, starting with
   "Repository bootstrap and package-script surface".
3. After each coherent unit, commit and push to `master` automatically, matching
   the repository's `AGENTS.md` convention.

After the action, report in human-readable terms what was done and which files,
gates, or behavior it affects; update §"Where the loop stands now" when the
non-derivable state changed; and END the report with the next handoff prompt
line from §"Resume" plus a description of the next ripe action, e.g.:

> Next: implement `li-XXXXXX` — <title> (<what it provisions>). Paste this into
> Claude Code or Codex:
>
> ```text
> plan/guardrail/handoff.md
> ```

Do not start product implementation under `src/**` until this plan's completion
criteria are met.

## Required ordering

Drive guardrail work additively in the order recorded in
`plan/guardrail/research/findings.md`:

1. Repository bootstrap and package-script surface.
2. Aggregate check skeleton.
3. TypeScript, Svelte, lint, and format gates.
4. Content-triggered Red -> Green TDD gate.
5. Local memory guardrail and discipline inventory.
6. GitHub CI and pull-request automation.
7. Result/ROP enforcement gate.
8. Coverage and property gates.
9. Scenario coverage gate.
10. Green precondition for product work.
11. Terminal handoff to `plan/mvp/`.

## Terminal step

When the full guardrail harness is present, operational, and green:

1. Create `plan/mvp/research/findings.md` and `plan/mvp/handoff.md`.
2. Flip `.livespec.jsonc` `post_step_skip_capture_impl_gaps` back to `false` or
   remove that skip so product implementation gap capture is active.
3. Hand off to `plan/mvp` - searchable interactive resume plus static-text
   resume only; no AI mode and no MCP server.
4. Commit and push with a conventional message such as
   `docs(plan): complete guardrail handoff to mvp`.

## Standing rules

- Always commit and land coherent work to `master`; do not ask for confirmation.
- Preserve the standalone boundary: no runtime, build, test, CI, or hook
  dependency on sibling livespec repositories or Python-only fleet tooling.
- Keep the first-party product-source boundary clear: repository harness/tooling,
  specs, docs, governed data, CI, hooks, and config are not `src/**` product
  source for the TDD pairing/range gates.
- Use livespec propose-change/revise before relying on a behavior change that is
  not already specified.
- NEVER talk to the maintainer using only an opaque phase code, work-item id,
  action id, version id, or command token. Always include a human-readable
  description of the task and the files, behavior, or gate it affects.
- ALWAYS end the session report with the next handoff prompt line from
  §"Resume" plus a human-readable description of the next ripe action, so the
  maintainer can paste it directly into the next Claude Code or Codex session.

## Where the loop stands now

Only non-derivable state is recorded here; the current ripe work item is
derivable by running the livespec-orchestrator-git-jsonl `next` skill against
`work-items.jsonl`.

Current state: **work items seeded** (commit `b03c271`, 2026-07-07). The 11
dependency-ordered guardrail slices from
`plan/guardrail/research/findings.md` §"Work slices" are filed in
`work-items.jsonl` as `li-ugymfg` through `li-gzmujc`, each depending on its
predecessor so exactly one item is ripe at a time. The `needs-attention` /
`drive` operator surface does not exist yet — use the git-jsonl fallback
(`next` then `implement`). No guardrail artifact (no `package.json`) exists
yet.

Next ripe action: implement `li-ugymfg` — "Repository bootstrap and
package-script surface" (pinned Bun/SvelteKit project metadata, the required
Bun script surface including `bootstrap`/`check`/`tdd-commit`, and a
`bootstrap` that installs the committed hooks).

## Resume

Paste this into Claude Code or Codex:

```text
plan/guardrail/handoff.md
```
