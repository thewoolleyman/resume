# Handoff - MVP (ported + redesigned + live + reviewed)

**Thread:** `plan/mvp/` - **Driver-agnostic:** paste this file's path into
either Claude Code or Codex. The goal is to complete the **MVP** — the
predecessor site ported to data/behavior parity (interactive resume at `/`,
static resume at `/static`), **visually redesigned**, **deployed live across
all environment classes**, and **thoroughly reviewed on the running site** —
under the repository guardrail discipline that `plan/guardrail/` provisioned
and proved.

## Read first

1. `plan/mvp/research/findings.md` — what the MVP is (ported + redesigned +
   live + reviewed), what it is NOT (no AI/MCP — that is `plan/ai/`), the
   work-slice order, and the completion criteria.
2. `SPECIFICATION/spec.md` §"Delivery phases" (head **v026** — the redefined
   MVP), `contracts.md` §"Web routes" / §"Environment contract",
   `constraints.md` §"Framework and deployment", and `scenarios.md` — the
   authoritative product requirements.
3. `SPECIFICATION/non-functional-requirements.md` — the guardrail discipline
   every commit runs under (already enforced by `bun run check` and the
   installed hooks).

## What this thread is

This plan completes the MVP: the interactive and static surfaces ported to
predecessor **data and behavior** parity, then **redesigned**, **deployed
live** across Development / Preview / Production (at
`https://resume.thewoolleyweb.com`), and **reviewed on the running site** by
both the LLMs and the maintainer. A green local `bun run check` is a
precondition of — never a substitute for — the live deployment and review.

This thread does **NOT** implement AI-driven mode (`/ai` answering behavior) or
the MCP server. Those are a separate, later delivery planned in **`plan/ai/`**,
activated only by a future proposed change, and held to the same
live-and-reviewed bar. `/ai` MAY be omitted or a documented placeholder in the
MVP.

## Loop autonomously until blocked or complete

Drive work items in a continuous loop within the session — do NOT stop after
one action. Each iteration:

1. Pick the ripe item: run the livespec-orchestrator-beads-fabro
   `needs-attention` skill for cross-plan triage, or `next` to rank the next
   work item.
2. Execute it: run the livespec-orchestrator-beads-fabro `drive --action
   <action-id>`, or `implement` for that one item (Red -> Green, close with
   merge evidence).
3. Commit and push each coherent unit to `master` automatically, matching the
   repository's `AGENTS.md` convention, then continue to the next iteration.

If no remaining MVP work items exist yet, seed them from
`plan/mvp/research/findings.md` §"Work slices" (the remaining R1-R4 slices)
using livespec-orchestrator-beads-fabro `capture-work-item` (small,
dependency-ordered items with human-readable titles), or let `capture-impl-gaps`
surface spec->impl gaps to file.

STOP looping only when one of these holds:

- **MVP complete** — `findings.md` §"Completion criteria" is fully met: ported
  surfaces parity-green, redesign applied, site live across all environment
  classes, and the running site reviewed and signed off by the maintainer.
  Perform the Terminal step.
- **Maintainer blocker** — a decision or intervention only the human maintainer
  can provide. For this thread the known blockers are: **Vercel project linkage
  and deploy credentials + custom-domain DNS** (slice R1, live deployment); the
  **maintainer's visual design pass with Claude Design** (slice R2); and the
  **maintainer's review and sign-off on the running Production site** (slice
  R4). Also: any needed spec change (propose-change/revise), a conflict with a
  ratified decision, or anything destructive/irreversible. State the blocker in
  human-readable terms and what decision or action is needed.
- **Session limits** — the context or session is ending; land what is coherent,
  never a half-implemented surface or a red gate.

When the loop pauses or stops, report in human-readable terms what was done and
which files, surfaces, or scenarios it affects; update §"Where the loop stands
now" when the non-derivable state changed; and END the report with the next
handoff prompt line from §"Resume" plus a description of the next ripe action
(or the blocker awaiting the maintainer).

## Required ordering

The ported surface (slices 1-10 in `findings.md`) is built and merged. Drive the
**remaining** MVP work in `findings.md` §"Work slices" order:

- **R1. Live deployment across all environment classes** (maintainer blocker:
  Vercel linkage/credentials + DNS). Live and reachable in Development, Preview,
  and Production at `https://resume.thewoolleyweb.com`; Preview non-indexed.
- **R2. Visual redesign** (maintainer performs the design pass with Claude
  Design). Applied under guardrail discipline; preserves every behavioral
  scenario and the accessibility/responsive/no-horizontal-scroll requirements.
- **R3. Redeploy the redesigned site** across all environment classes.
- **R4. Thorough review of the running site** by the LLMs and the maintainer;
  resolve findings; maintainer signs off on Production.

## Terminal step

When the MVP meets `findings.md` §"Completion criteria" (ported surfaces
parity-green with `bun run check` all-gates-ACTIVE; site live across
Development / Preview / Production at the custom domain; redesign applied on the
live site preserving all behavioral scenarios and a11y/responsive requirements;
the running site reviewed by the LLMs and the maintainer with findings resolved
and maintainer sign-off):

1. Verify the live Production site at `https://resume.thewoolleyweb.com` and the
   Preview environment satisfy `constraints.md` §"Framework and deployment",
   §"Accessibility and responsive behavior", and §"Performance and
   availability", and that Preview is non-indexed.
2. Report MVP completion and hand off to the maintainer for the **AI delivery**
   (`plan/ai/`), which begins only when a future proposed change activates the
   AI/MCP surfaces.
3. Commit and push with a conventional message such as
   `docs(plan): complete mvp`.

## Standing rules

- Always commit and land coherent work to `master`; do not ask for
  confirmation.
- Preserve the standalone boundary: no runtime, build, test, CI, or hook
  dependency on sibling livespec repositories or Python-only fleet tooling.
- Keep the first-party product-source boundary clear: `src/**` (and Playwright
  specs under `e2e/**`, Vitest `*.test.ts`) is product/test source; repository
  harness/tooling, specs, docs, governed data, CI, hooks, and config are not
  `src/**` product source for the TDD pairing/range gates.
- Do NOT introduce AI answering behavior or an MCP surface in this plan; that is
  `plan/ai/`.
- The redesign MUST NOT weaken any load-bearing scenario, accessibility,
  responsive, or no-horizontal-scroll requirement, and MUST NOT weaken any
  guardrail gate.
- Use livespec propose-change/revise before relying on a behavior change that is
  not already specified.
- NEVER talk to the maintainer using only an opaque phase code, work-item id,
  action id, version id, or command token. Always include a human-readable
  description of the task and the files, behavior, or surface it affects.
- ALWAYS end the session report with the next handoff prompt line from
  §"Resume" plus a human-readable description of the next ripe action.

## Where the loop stands now

Only non-derivable state is recorded here; the current ripe work item is
derivable by running the livespec-orchestrator-beads-fabro `next` skill against
the beads store.

**Current state: the PORT is complete and merged to `master`; the MVP is NOT
complete** — the visual redesign, live deployment across all environment
classes, and the review of the running site all remain.

- **Port done and green.** `src/**`, `data/resume.yml`, and the toolchain
  landed on `master` (`021b857 feat: implement phase-1 interactive and static
  resume`, plus follow-up `test(harness):` commits). `bun run check` is fully
  green with all gates ACTIVE over `src/**`: the SvelteKit + Vercel-adapter
  production build prerenders `/` and `/static`, coverage is 100% line/branch,
  property/fuzz is reproducible, all 36 scenarios resolve (24 browser-observable
  Playwright + 12 non-browser), and the Playwright e2e suite passes. Interactive
  and static surfaces render `data/resume.yml` to predecessor data/behavior
  parity (18 keys, 16 sections, 74 items). This satisfies MVP completion item 1
  and the local-build precondition — but NOT the live-deployment, redesign, or
  review items.

- **Delivery model redefined (spec head v026).** `SPECIFICATION/spec.md`
  §"Delivery phases" now defines the MVP as ported + redesigned + live + reviewed
  and moves AI/MCP to a separate later delivery; `constraints.md` §"Framework and
  deployment" now requires live deployment across all environment classes for MVP
  completion. The `phase 1` token is retained ("Phase 1 is the MVP"), so the
  guardrail gates and parity/identifier/scenario requirements are unaffected.

- **What remains (the ripe work).**
  - **R1 live deployment — MAINTAINER BLOCKER.** The app is not deployed to
    Vercel. Needs maintainer-provided Vercel project linkage / deploy
    credentials and custom-domain DNS for `resume.thewoolleyweb.com`. Deploying
    is not required for the local build to be green, but IS required for MVP
    completion.
  - **R2 visual redesign — MAINTAINER-DRIVEN.** The maintainer performs a design
    pass with Claude Design on the running site, then the redesign is implemented
    under guardrail discipline preserving all behavioral scenarios and
    a11y/responsive requirements.
  - **R3/R4 redeploy + review.** Redeploy the redesigned site; the LLMs and the
    maintainer review the running Production site and sign off.

- **AI delivery relocated.** All AI-driven-mode and MCP planning now lives in
  `plan/ai/` (separate thread), not in `plan/mvp/`.

The work-item orchestrator is `livespec-orchestrator-beads-fabro`, backed by the
`resume` beads/Dolt tenant. Drive work through its operator loop — `drive` /
`plan` / `needs-attention` / `next` / `implement` / `capture-work-item`.

Next ripe action: **deploy the ported app live across all environment classes
(slice R1)** — a maintainer blocker pending Vercel project linkage / deploy
credentials and DNS for `https://resume.thewoolleyweb.com`. In parallel, the
maintainer's visual design pass (slice R2, with Claude Design) can begin against
the running app. Neither the redesign nor the live deployment is done, so the
MVP is not complete.

## Resume

Paste this into Claude Code or Codex:

```text
plan/mvp/handoff.md
```
