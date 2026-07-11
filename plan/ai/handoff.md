# Handoff - AI delivery (AI-driven mode + MCP server)

**Thread:** `plan/ai/` - **Driver-agnostic:** paste this file's path into either
Claude Code or Codex. This is the **separate, later delivery** that follows the
MVP (`plan/archive/mvp/`). It adds ONLY the AI/LLM surfaces — AI-driven mode at `/ai`
and the MCP server — held to the same live-and-reviewed bar as the MVP, under
the repository guardrail discipline.

## Do NOT start this thread until the MVP is complete

Per `SPECIFICATION/spec.md` §"Delivery phases", AI-driven mode and the MCP
server are non-load-bearing until a future proposed change activates them, and
they follow the MVP. This thread is **blocked on MVP completion** — the ported
interactive/static surfaces redesigned, deployed live across all environment
classes, and reviewed/signed-off on the running Production site
(`plan/archive/mvp/research/findings.md` §"Completion criteria"). The MVP completed and was
signed off on 2026-07-11 (its thread is archived at `plan/archive/mvp/`), so
that precondition is now met; this thread still begins only once a future
livespec proposed change activates the AI/MCP surfaces (next section).

## Read first

1. `plan/ai/research/findings.md` — the goal, the spec sections to activate,
   non-goals, the provisional work slices, and completion criteria.
2. `SPECIFICATION/spec.md` §"AI answering behavior" / §"MCP behavior",
   `contracts.md` §"AI chat contract" / §"Future MCP contract" / §"Web routes"
   (`/ai`), and `constraints.md` §"AI safety and grounding" / §"MCP safety" /
   §"External services".
3. `SPECIFICATION/non-functional-requirements.md` — the guardrail discipline.

## What this thread is

This thread delivers the AI/LLM product surfaces:

- **AI-driven mode (`/ai`)** — grounded, cited question answering with the four
  response statuses (`answered`, `partial`, `unanswerable`, `declined`) and the
  decline rules; provider calls only from server/edge/secret-safe contexts;
  provider failure never breaks `/` or `/static`.
- **MCP server** — governed resume data and supported Q&A via stable
  tools/resources, sharing the web app's data-access/grounding modules, runnable
  without the browser UI, exposing no secrets/files/credentials.

Both are held to the same bar as the MVP: implemented under the guardrail
discipline, deployed live across Development / Preview / Production (at
`https://resume.thewoolleyweb.com`), and reviewed on the running site by both
the LLMs and the maintainer.

## First work item: activate the spec

The AI/MCP requirements are deferred (non-load-bearing) in the ratified spec.
The FIRST action in this thread is a livespec **propose-change -> revise** that
makes them load-bearing — pinning the model provider, retrieval/grounding
mechanism, prompt/citation format, storage backend, and their env-var/failure/
local-dev contracts, and mapping the later-phase scenarios in
`scenario-coverage.json`. Do not write AI/MCP `src/**` before that activation
lands; the phase-boundary guardrail checks and the adversarial reviewer will
(correctly) flag premature AI/MCP scaffolding.

## Loop autonomously until blocked or complete

Once activated, drive work items in a continuous loop (same protocol as the MVP
handoff): `needs-attention` / `next` to pick the ripe item, `drive --action
<id>` or `implement` to execute Red -> Green with merge evidence, then commit and
push each coherent unit to `master`. Seed the provisional slices in
`findings.md` §"Work slices" via `capture-work-item` if no AI work items exist
yet.

STOP looping only for:

- **AI delivery complete** — `findings.md` §"Completion criteria" fully met
  (activated spec, mapped scenarios green, `/ai` grounded/cited, MCP safe and
  UI-independent, deployed live across all environment classes, reviewed and
  signed off on the running site). Perform the Terminal step.
- **Maintainer blocker** — the spec-activation decision (provider/retrieval/
  storage choices), AI provider credentials and deploy credentials, or the
  maintainer's review sign-off on the running AI/MCP surfaces. State the blocker
  in human-readable terms.
- **Session limits** — land coherent work; never a half-implemented surface or a
  red gate.

## Terminal step

When the AI delivery meets `findings.md` §"Completion criteria" (grounded/cited
`/ai`, safe UI-independent MCP, all mapped scenarios green, `bun run check`
all-gates-ACTIVE, deployed live across all environment classes, and the running
site reviewed and signed off by the maintainer): verify the live Production and
Preview AI/MCP behavior satisfies the spec's grounding and safety constraints,
report completion to the maintainer, and commit with a message such as
`docs(plan): complete ai delivery`.

## Standing rules

- Do NOT regress or restyle the MVP's interactive/static surfaces to stand up
  AI/MCP.
- Provider calls only from server/edge/secret-safe contexts; no keys, private
  prompts, or private fixtures in client bundles.
- Never present ungrounded model output as resume fact; `answered`/`partial`
  responses asserting a resume fact MUST carry at least one citation.
- The MCP surface exposes only governed data + documented capabilities — no
  filesystem/shell/deploy-secret/ungoverned-memory access.
- Preserve the standalone boundary and the `src/**` product-source boundary.
- Use livespec propose-change/revise before relying on any behavior not already
  specified.
- NEVER talk to the maintainer using only an opaque token; always include a
  human-readable description of the task and the surface it affects.

## Where the loop stands now

**Not started — blocked on MVP completion.** No AI/MCP product source exists and
none should be written until (a) the MVP is complete and signed off, and (b) a
livespec proposed change activates the AI/MCP spec sections. No AI work items are
seeded in the beads store yet; seed them from `findings.md` §"Work slices" when
the thread opens.

Next ripe action (once the MVP is complete): **file the livespec propose-change
that activates the AI/MCP spec sections** (provider, retrieval/grounding, prompt/
citation format, storage, and their env/failure/local-dev contracts; map the
later-phase scenarios), then revise to ratify — the precondition to writing any
AI/MCP `src/**`.

## Resume

Paste this into Claude Code or Codex:

```text
plan/ai/handoff.md
```
