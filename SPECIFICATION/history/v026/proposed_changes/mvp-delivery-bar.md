---
topic: mvp-delivery-bar
author: claude-opus-4-8
created_at: 2026-07-09T21:06:16Z
---

## Proposal: The MVP is the ported surfaces plus a visual redesign, deployed live across all environment classes and reviewed; AI/MCP is a separate later delivery

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/constraints.md

### Summary

Ratify the repository owner's decision (2026-07-09) that redefines what the
first delivered milestone — the **MVP** — is, and when it is complete. The MVP
is NOT "code merged with the local gates green." The MVP is the predecessor
site PORTED (the interactive resume at `/` and the static resume at `/static`,
to predecessor DATA and BEHAVIOR parity) PLUS a deliberate visual REDESIGN,
DEPLOYED LIVE across all three environment classes defined in
`contracts.md` §"Environment contract" (Development, Preview, and Production at
`https://resume.thewoolleyweb.com`), and REVIEWED against the running deployed
site by both automated/LLM reviewers and the maintainer. All of those are
required for MVP completion.

This change also makes the AI-driven mode and the MCP server an explicitly
SEPARATE, later delivery planned and built only AFTER the MVP ships and is
reviewed — not a "phase 2" bundled into the same track — held to the same
live-and-reviewed bar. It does not activate any AI or MCP behavior.

The change preserves the existing hard boundary that MVP completion MUST NOT
require an AI route, AI answering behavior, or an MCP surface. It keeps the
load-bearing `phase 1` / `phase-1` token intact throughout the specification
(establishing "Phase 1 is the MVP" rather than renaming the token), so the
predecessor-parity, governed-data, identifier, and scenario requirements and
the guardrail gates that key off that token are unaffected. Predecessor parity
in the MVP is clarified to be a DATA and BEHAVIOR requirement, not a visual
one: departing from the predecessor's visual appearance via the redesign is
expected and MUST NOT be treated as a parity regression.

### Motivation

The prior §"Delivery phases" defined phase-1 completion "entirely by the
interactive and static contracts, constraints, and scenarios," which let a
local, un-deployed, un-redesigned build that merely passes `bun run check` be
read as "phase 1 done." The owner has ruled that the MVP is not done until it
is (a) visually redesigned, (b) live and reachable in production across all
environment classes, and (c) thoroughly reviewed on the running site by the
LLMs and the maintainer. The redesign is a first-class part of the MVP — the
owner performs a design pass (with Claude Design) on the running site — not a
follow-on. Recording this in the ratified specification keeps the completion
bar unambiguous and prevents a premature "complete" claim, while keeping AI and
MCP cleanly out of the MVP so they are planned and delivered separately.

### Proposed changes

#### 1. spec.md — replace the entire §"Delivery phases" section

Replace the current §"Delivery phases" (the paragraph beginning "Delivery is
phased, and the phase boundary is load-bearing so implementers know exactly
what phase-1 completion requires." through the paragraph ending "…MUST NOT
regress the interactive or static surfaces in order to stand up AI or MCP
scaffolding.") with:

> ## Delivery phases
>
> Delivery is phased, and the phase boundary is load-bearing so implementers
> know exactly what the MVP requires. Phase 1 is the MVP: the first delivered
> milestone of this product.
>
> **The MVP (phase 1).** The MVP MUST deliver the interactive and static
> resume modes with predecessor data and behavior parity, presented through a
> deliberately redesigned visual UI, deployed live, and reviewed. MVP
> completion requires ALL of the following:
>
> - **Ported surfaces.** The interactive resume at `/` and the static resume
>   at `/static`, satisfying the interactive and static contracts,
>   constraints, and scenarios, over the governed data with predecessor data
>   and behavior parity — the pinned production scope, the stable item and
>   section identifiers, the search/filter/sort/collapse/reset behavior, the
>   route and deep-link semantics, and the browser-metadata parity.
> - **Visual redesign.** The MVP's visual presentation MUST be a deliberate
>   redesign rather than a reproduction of the predecessor's Bootstrap look.
>   Departing from the predecessor's visual appearance is expected and MUST
>   NOT be treated as a parity regression; predecessor parity in the MVP is a
>   data and behavior requirement, not a visual one (per §"Predecessor data
>   model parity"). The redesign MUST preserve every load-bearing behavioral
>   scenario in `scenarios.md` and the accessibility, responsive, and
>   no-horizontal-scroll requirements in `constraints.md`.
> - **Live across all environment classes.** The MVP MUST be deployed and
>   reachable across all three environment classes defined in
>   `contracts.md` §"Environment contract" — Development (local), Preview
>   (Vercel branch or pull-request deployments), and Production (the public
>   site at `https://resume.thewoolleyweb.com`) — not merely produce a local
>   adapter build. Preview URLs remain non-indexed and non-canonical per
>   `constraints.md` §"Framework and deployment".
> - **Reviewed.** The deployed MVP MUST be reviewed against the running site
>   by both automated/LLM reviewers and the maintainer before the MVP is
>   considered complete. A green local `bun run check` is a precondition of,
>   not a substitute for, this review.
>
> MVP completion MUST NOT require an AI route, AI answering behavior, or an
> MCP surface.
>
> **The later AI delivery (post-MVP).** AI-driven mode and the MCP server are
> a separate, later delivery, planned and implemented only after the MVP ships
> and is reviewed. They are NOT part of the MVP and MUST remain non-load-bearing
> until a future proposed change activates them; when that delivery is built it
> is held to the same live-and-reviewed bar as the MVP (deployed across all
> environment classes and reviewed on the running site). To keep the boundary
> unambiguous:
>
> - The `/ai` route in `contracts.md` §"Web routes" is a later-delivery route.
>   The MVP MAY omit it entirely or serve a documented placeholder; an MVP
>   implementation MUST NOT be judged non-compliant for lacking AI behavior.
> - The AI chat contract in `contracts.md` §"AI chat contract" and the Future
>   MCP contract in `contracts.md` §"Future MCP contract" are later-delivery
>   contracts.
> - The AI and MCP scenarios in `scenarios.md` §"Later-phase scenarios
>   (non-load-bearing in phase 1)" are later-delivery scenarios and MUST NOT
>   be mapped to MVP acceptance tests.
>
> An MVP implementation MUST NOT regress the interactive or static surfaces in
> order to stand up AI or MCP scaffolding.

#### 2. spec.md — §"Operating modes", clarify MVP membership

In the numbered mode list, change the trailing sentence of item 1 (Interactive
mode) from "This mode is phase-1." to "This mode is part of the MVP (phase 1)."
and item 2 (Static resume mode) from "This mode is phase-1." to "This mode is
part of the MVP (phase 1)." Change the trailing sentence of item 3 (AI-driven
mode) from "This mode is later-phase and non-load-bearing in phase 1 per
§\"Delivery phases\"." to "This mode is a later, post-MVP delivery and
non-load-bearing in phase 1 per §\"Delivery phases\"."

#### 3. spec.md — §"Predecessor data model parity", clarify the visual posture

At the end of the closing paragraph that begins "This section pins the
conceptual shape and inventory to preserve predecessor workflows; it does not
require the new implementation to reuse the predecessor's Vuex state shape, YAML
parsing, Fuse.js search behavior, Bootstrap styling, or Nuxt 2 implementation."
append: "Accordingly, the MVP deliberately redesigns the visual presentation
per §\"Delivery phases\"; predecessor parity is a data and behavior requirement,
and a redesigned visual appearance is expected rather than a parity regression."

#### 4. constraints.md — §"Framework and deployment", require live deployment for MVP completion

After the paragraph ending "Preview URLs MUST be treated as non-production
environments and MUST NOT be indexed or presented as canonical resume URLs."
add a new paragraph:

> Deployability alone is not sufficient for MVP completion. Per
> `spec.md` §"Delivery phases", the MVP MUST be deployed live and reachable
> across all three environment classes in `contracts.md` §"Environment
> contract" — Development, Preview, and Production at
> `https://resume.thewoolleyweb.com` — and reviewed on the running site, not
> merely produce a passing local adapter build.
