# Research - MVP (ported interactive + static resume, redesigned, live, reviewed)

Design of record for `plan/mvp/`. This plan begins after `plan/guardrail/`
provisioned and proved the repository guardrail harness (all `bun run check`
gates operational and green; the content-triggered Red -> Green commit-msg hook
and the local-memory pre-commit hook live for every commit).

The active handoff is `plan/mvp/handoff.md`.

## What the MVP is (read this first)

The MVP is the **first delivered milestone** of the product, and per the
ratified `SPECIFICATION/spec.md` §"Delivery phases" it is NOT "code merged with
the local gates green." The MVP is:

1. The **predecessor site ported** — the searchable/filterable interactive
   resume at `/` and the traditional static-text resume at `/static`, to
   predecessor **data and behavior** parity; PLUS
2. A **deliberate visual redesign** of that ported surface (the maintainer's
   design pass, performed with Claude Design on the running site) — departing
   from the predecessor's Bootstrap look is expected, not a regression; PLUS
3. **Deployed live and reachable across all three environment classes**
   defined in `contracts.md` §"Environment contract" — Development (local),
   Preview (Vercel branch/PR deploys), and Production (the public site at
   `https://resume.thewoolleyweb.com`) — not merely a local adapter build; AND
4. **Thoroughly reviewed on the running deployed site** by both automated/LLM
   reviewers and the maintainer.

The MVP is complete only when ALL of 1-4 hold. A green local `bun run check` is
a **precondition of**, not a substitute for, the live deployment and review.

## What the MVP is NOT

- The MVP does **NOT** include AI-driven mode (`/ai` answering behavior), the
  AI chat contract, or the MCP server. Those are a **separate, later delivery**
  planned in `plan/ai/` (see §"Follow-on: the AI delivery"), activated only by
  a future proposed change, and held to the same live-and-reviewed bar. `/ai`
  MAY be omitted in the MVP or serve a documented placeholder.
- The MVP does **NOT** require a native mobile app, recruiter portal, analytics
  dashboard, or general chatbot (`spec.md` §"Non-goals").
- The redesign does **NOT** license regressing any load-bearing behavioral
  scenario, accessibility, responsive, or no-horizontal-scroll requirement.
  Predecessor parity is a data/behavior requirement; the redesign changes the
  visual presentation only.

## Source of truth

The authoritative requirements are the ratified specification (head **v026**,
which redefined the delivery model). Do not re-specify here; drive the spec:

- `SPECIFICATION/spec.md` — §"Delivery phases" (the redefined MVP: ported +
  redesigned + live + reviewed; AI/MCP a separate later delivery), §"Operating
  modes", §"Resume data", §"Governed data source and predecessor import
  (phase 1)" (single canonical `data/resume.yml`, committed production snapshot
  with pinned provenance, and the pinned scope: 18 keys, 16 sections, 74
  items), §"Stable item identifiers", §"Stable section identifiers", and
  §"Predecessor data model parity" (parity is data/behavior; the visual
  presentation is deliberately redesigned).
- `SPECIFICATION/contracts.md` — §"Web routes" (`/` and `/static` in the MVP,
  `/ai` a later-delivery route), the resume/governed-data contracts,
  §"Interactive rendering contract", §"Item rendering", §"Search", §"Layout and
  controls", §"Error payloads", and §"Environment contract" (Development /
  Preview / Production and the production URL `https://resume.thewoolleyweb.com`).
- `SPECIFICATION/constraints.md` — §"Framework and deployment" (SvelteKit +
  Vercel adapter, prerender, and the requirement that the MVP be deployed live
  across all environment classes, not merely deployable), §"Browser metadata
  parity", §"Accessibility and responsive behavior", §"Performance and
  availability", and the standalone boundary.
- `SPECIFICATION/scenarios.md` — the 36 load-bearing scenarios, each classified
  and mapped in `scenario-coverage.json`. The redesign MUST preserve all of
  them.
- `SPECIFICATION/non-functional-requirements.md` — the guardrail discipline
  every commit runs under (TDD Red -> Green, strict TS/Svelte/lint/format,
  Result/ROP, 100% line+branch coverage for `src/**`, reproducible
  property/fuzz, scenario coverage, CI + PR automation).

## Where the MVP stands (derivable state summary)

The **port (item 1 above) is built and merged to `master`** — `src/**`,
`data/resume.yml`, both routes prerender, all `bun run check` gates green, e2e
passing. What REMAINS for MVP completion is items 2-4: the visual redesign,
live deployment across all environment classes, and the thorough review of the
running site. The non-derivable, up-to-date state lives in
`plan/mvp/handoff.md` §"Where the loop stands now".

## Work slices

The port slices (built and merged) are retained here for provenance; the
**remaining** MVP slices are R1-R4.

### Ported surface (built and merged — provenance)

1. **SvelteKit + Vercel toolchain scaffold** — first `src/**`; real
   Vitest/Playwright runners; armed gates activated.
2. **Governed data source** — `data/resume.yml` verbatim production snapshot,
   pinned provenance + scope (18 keys, 16 ordered sections, 74 items).
3. **Load + transform (Result/ROP)** — authoring shape -> contract shape;
   malformed-data rejection at build/prerender.
4. **Deterministic derivations** — item/section slug + `-2`/`-3` collision;
   ISO-8601/UTC dates; DOM-free search projection (the property/fuzz targets).
5. **Interactive domain logic** — search, skill-level filter, section sort with
   tie-breaks, search->filter->sort composition.
6. **Interactive rendering (`/`)** — prerendered shell, governed order, deep
   links, legacy `#list-<ordinal>` aliases, collapse/reset.
7. **Static rendering (`/static`)** — all governed data, canonical order, fully
   expanded, crawlable/printable.
8. **Shared markdown rendering** — one renderer, byte-identical output, trusted
   raw HTML preserved.
9. **Browser metadata + manifest** — title, description, viewport, icons,
   manifest, robots/canonical.
10. **Scenario test authoring + parity verification** — every mapped identifier
    resolves to an executable test; predecessor data/behavior parity verified.

### Remaining MVP slices (the new completion work)

R1. **Live deployment across all environment classes.** Link/configure the
   Vercel project and deploy the ported app so it is live and reachable in all
   three environment classes: Development (local), Preview (Vercel branch/PR
   deploys), and Production at `https://resume.thewoolleyweb.com`. Preview URLs
   stay non-indexed and non-canonical. **Maintainer blocker:** requires
   maintainer-provided Vercel project linkage and deploy credentials, and DNS
   for the custom domain. Verify each environment renders `/` and `/static` and
   hydrates.

R2. **Visual redesign.** The maintainer performs a design pass (with Claude
   Design) that replaces the predecessor Bootstrap look with a deliberate
   redesign. The redesign is applied under the same guardrail discipline
   (TDD/coverage/gates) and MUST preserve every load-bearing behavioral scenario
   in `scenarios.md` and the accessibility, responsive, and no-horizontal-scroll
   requirements in `constraints.md`. Update or re-verify Playwright specs whose
   selectors depend on DOM/structure the redesign changes, without weakening
   what they assert.

R3. **Redeploy the redesigned site** across all environment classes (R1's
   pipeline) so the live Production site reflects the redesign.

R4. **Thorough review of the running site.** Both automated/LLM reviewers and
   the maintainer review the deployed, redesigned site — not just the local
   build — for parity, redesign quality, accessibility, responsiveness,
   metadata, and cross-environment correctness. Capture and resolve findings.
   The maintainer's sign-off on the running Production site is the final gate.

Each code-bearing slice: Red -> Green, Result/ROP where core exports return
typed results, 100% line+branch coverage for the source it adds/changes,
property/fuzz for the named targets, and the mapped scenario tests kept green.

## Completion criteria

The MVP is complete when ALL of the following hold:

- The ported interactive (`/`) and static (`/static`) surfaces render the
  committed `data/resume.yml` to predecessor **data and behavior** parity (18
  keys, 16 sections, 74 items), with every load-bearing scenario's mapped
  executable test present and passing and `check:scenarios` resolving every
  identifier.
- `bun run check` passes with all gates ACTIVE over real `src/**` (100%
  line+branch coverage, Result/ROP AST checks, property/fuzz, scenario
  resolution) — the **precondition** to deployment and review.
- The site is **deployed live and reachable across all three environment
  classes** — Development, Preview, and Production at
  `https://resume.thewoolleyweb.com` — with Preview non-indexed.
- The **visual redesign** is applied on the live site, preserving all behavioral
  scenarios and the accessibility/responsive/no-horizontal-scroll requirements.
- The running, deployed, redesigned site has been **thoroughly reviewed by both
  the LLMs and the maintainer**, findings resolved, and the maintainer has
  signed off on the Production site.
- No AI answering behavior and no MCP surface were introduced (the `/ai` route
  is omitted or a documented placeholder).

## Follow-on: the AI delivery

AI-driven mode (`/ai`) and the MCP server are a **separate, later delivery**,
planned in **`plan/ai/`** (see `plan/ai/research/findings.md` and
`plan/ai/handoff.md`). That work begins only AFTER the MVP ships and is
reviewed, is activated by a future livespec proposed change that makes the AI/MCP
requirements load-bearing, and is held to the same live-and-reviewed bar
(deployed across all environment classes and reviewed on the running site).

## Operator surface

Driveable in either Claude Code or Codex. Drive the work via the
livespec-orchestrator-beads-fabro operator loop: `needs-attention` ->
`drive --action <id>` -> commit/push, with `plan` / `next` to rank the next work
item and `implement` / `capture-work-item` as the per-item and capture
front-ends. Sessions run this loop autonomously and stop only for a maintainer
blocker (e.g. Vercel credentials for R1, or the maintainer's design pass in R2
and sign-off in R4), plan completion, or session limits (see
`plan/mvp/handoff.md`). Gap capture is ACTIVE (`capture-impl-gaps` /
`capture-spec-drift`).

## Communication rule

Never talk to a human using only an opaque phase code, work-item id, action id,
version id, or command token. Always pair the token with a human-readable
description of the work and the files or behavior it affects.
