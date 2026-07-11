# Research - AI delivery (AI-driven mode + MCP server)

Design of record for `plan/ai/`. This thread is the **separate, later delivery**
that follows the MVP (`plan/archive/mvp/`). It deals ONLY with adding the AI/LLM-related
surfaces: AI-driven question-answering mode at `/ai` and the MCP server. It does
NOT touch the ported interactive/static surfaces except where AI/MCP integration
requires shared data-access modules.

The active handoff is `plan/ai/handoff.md`.

## Precondition: this thread starts only after the MVP ships

This delivery begins ONLY after the MVP is complete per
`plan/archive/mvp/research/findings.md` §"Completion criteria" — the ported interactive
and static surfaces are parity-green, visually redesigned, deployed live across
all environment classes, and reviewed and signed off by the maintainer on the
running Production site.

Per `SPECIFICATION/spec.md` §"Delivery phases", the AI-driven mode and the MCP
server are non-load-bearing until a **future livespec proposed change activates
them**. So the FIRST work item in this thread is a livespec **propose-change ->
revise** that makes the AI/MCP requirements load-bearing (retrieval, provider,
prompt, tool, and protocol behavior currently deferred in the spec). Do not
write AI/MCP product source before that activation lands, or the phase-boundary
guardrail checks and the adversarial reviewer will correctly flag it.

## Goal

Deliver the AI/LLM surfaces of the product, held to the SAME bar as the MVP —
implemented under the guardrail discipline, **deployed live across all
environment classes** (Development, Preview, Production at
`https://resume.thewoolleyweb.com`), and **thoroughly reviewed on the running
site** by both the LLMs and the maintainer:

- **AI-driven mode (`/ai`).** A chat interface where visitors ask questions
  about the resume owner and receive answers grounded in governed resume data,
  with source attribution, distinguishing the four response statuses
  (`answered`, `partial`, `unanswerable`, `declined`) and following the decline
  rules.
- **MCP server.** A server exposing governed resume data and the supported
  question-answering capability through stable tools/resources, sharing the
  web app's data-access and answer-grounding modules, and NOT requiring the
  browser UI to run.

## Source of truth

The authoritative requirements are the ratified specification. These AI/MCP
sections are currently non-load-bearing and MUST be activated by a proposed
change before they gate implementation:

- `SPECIFICATION/spec.md` §"AI answering behavior" (grounding, source
  attribution, the four response statuses, decline rules; provider/retrieval/
  prompt/storage deferred), §"MCP behavior" (expose governed data + Q&A via
  stable tools/resources; no secrets/private files/credentials/ungoverned
  memory), and §"Operating modes" item 3.
- `SPECIFICATION/contracts.md` §"Web routes" (`/ai`), §"AI chat contract" (the
  `status`/`answer`/`citations`/`followups`/`diagnostic` response record and its
  citation rules), §"Future MCP contract", §"Environment contract", and
  §"Error payloads" (visitor-safe errors; no leaked prompts/secrets/provider
  payloads).
- `SPECIFICATION/constraints.md` §"AI safety and grounding" (server/edge-only
  provider calls; no keys/prompts/fixtures in client bundles; a boundary that
  prevents ungrounded output from being presented as fact), §"MCP safety", and
  §"External services" (documented env vars, failure behavior, local-dev
  behavior per external service).
- `SPECIFICATION/scenarios.md` §"Later-phase scenarios (non-load-bearing in
  phase 1)" — the AI/MCP acceptance scenarios (answerable / partial /
  unanswerable / unsafe-or-off-topic / provider-failure / MCP-client-reads-data)
  to be mapped to executable tests once activated.
- `SPECIFICATION/non-functional-requirements.md` — the same guardrail discipline
  as the MVP (TDD, Result/ROP, 100% coverage, property/fuzz, scenario coverage,
  CI + PR automation).

## Non-goals

- Do NOT regress or restyle the MVP's interactive/static surfaces to stand up
  AI/MCP scaffolding.
- Do NOT put provider API keys, private prompts, or private evaluation fixtures
  in client bundles.
- Do NOT present ungrounded model output as resume fact; every `answered`/
  `partial` response asserting a resume fact MUST carry at least one citation.
- Do NOT expose secrets, arbitrary filesystem access, shell execution, deploy
  credentials, or ungoverned memory through the MCP surface.

## Work slices (provisional — refine when the thread starts)

Dependency-ordered; refine and seed into the beads store via `capture-work-item`
when this thread begins.

1. **Activate the spec.** livespec propose-change -> revise to make the AI/MCP
   requirements load-bearing: choose and pin the model provider, retrieval/
   grounding mechanism, prompt/citation format, storage backend, and their
   env-var/failure/local-dev contracts; map the later-phase scenarios to
   acceptance-test classes in `scenario-coverage.json`.
2. **Grounding + data-access core.** Shared, browser-independent modules that
   read governed resume data and produce grounded answers with citations,
   returning `Result<T, DomainError>`; the boundary that refuses to present
   ungrounded output as fact.
3. **AI chat contract implementation.** The response record
   (`status`/`answer`/`citations`/`followups`/`diagnostic`), the four statuses,
   the decline rules, and visitor-safe error mapping.
4. **`/ai` route + UI.** Chat interface; provider calls only from
   server/edge/secret-safe contexts; never blocks `/` or `/static` initial
   render; provider failure never breaks the interactive or static modes.
5. **MCP server.** Stable tool/resource for structured resume data and (if
   exposed) Q&A preserving the AI chat outcome categories, over the same governed
   source; MCP safety boundary; runnable without the browser UI.
6. **Scenario tests + parity.** Author the mapped later-phase scenario tests so
   `check:scenarios` resolves each identifier; verify grounding, decline, and
   failure-isolation behavior.
7. **Live deployment + review.** Deploy across all environment classes; review
   the running AI/MCP surfaces (LLMs + maintainer), including a grounding/safety
   review; resolve findings; maintainer sign-off.

## Completion criteria

The AI delivery is complete when:

- The AI/MCP spec sections are activated (load-bearing) and every mapped
  later-phase scenario has its executable test present and passing;
  `check:scenarios` resolves every identifier.
- `bun run check` passes with all gates ACTIVE over the new `src/**` (100%
  line+branch coverage, Result/ROP, property/fuzz, scenario resolution).
- `/ai` answers are grounded with citations and correctly distinguish the four
  statuses and the decline rules; provider failure never breaks `/` or `/static`.
- The MCP server exposes only governed data + documented capabilities, runs
  without the browser UI, and leaks no secrets/files/credentials.
- The AI/MCP surfaces are deployed live across all environment classes and
  reviewed on the running site by both the LLMs and the maintainer, findings
  resolved, with maintainer sign-off.

## Operator surface

Same as the MVP: drive via the livespec-orchestrator-beads-fabro operator loop
(`needs-attention` / `next` / `drive` / `implement` / `capture-work-item`),
backed by the `resume` beads/Dolt tenant. Sessions stop only for a maintainer
blocker (provider/deploy credentials, the spec-activation decision, review
sign-off), plan completion, or session limits.

## Communication rule

Never talk to a human using only an opaque phase code, work-item id, action id,
version id, or command token. Always pair the token with a human-readable
description of the work and the files or behavior it affects.
