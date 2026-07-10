---
topic: claude-opus-4-8-critique
author: claude-opus-4-8
created_at: 2026-07-10T02:30:47Z
---

## Proposal: owner-authored-about-edit-model-undefined

### Target specification files

- SPECIFICATION/spec.md

### Summary

The owner directs a full rewrite of `about.content` in `data/resume.yml` — deleting the GitLab-job-targeting framing and the cover-letter references, and ADDING a new historical note (hand-coded in Vue in 2019 to land the GitLab role; converted to AI in 2026 via the owner's own livespec project and factory tooling). But spec.md §"Governed data source and predecessor import (phase 1)" → "Committed production snapshot" sanctions only ONE kind of edit to the committed snapshot: an owner-directed PII redaction that "removes characters within a preserved field's value and MUST NOT drop or add any top-level key, section, or item." There is no provision for owner-authored content that adds prose. The same section pins the committed-snapshot SHA-256 identically in the provenance comments, `src/lib/data/import.test.ts`, and this spec, and its re-pin discipline is written solely for the "2026-07-10 owner-directed redaction of the postal address" — so a content rewrite both violates the "MUST NOT ... add" rule and breaks all three hash pins with no sanctioned re-pin path.

### Motivation

The spec is silent on owner-authored content edits that are neither predecessor-parity imports nor PII redactions, and its "MUST NOT ... add" rule directly contradicts the owner's directive to add a historical note — an unresolved contradiction between the ratified editing model and the maintainer's stated intent. The cited design record (SPECIFICATION/history/v027/proposed_changes/permit-owner-pii-redaction-in-snapshot.md and its accept revision) deliberately scoped the relaxation to recorded, re-pinned PII *redactions* for privacy and otherwise framed the snapshot as a byte-verbatim provenance invariant; it does not contemplate additive content authoring. This finding does not treat the shipped snapshot as the presumed resolution — it surfaces that no design record sanctions the requested rewrite.

### Proposed Changes

In spec.md §"Governed data source and predecessor import (phase 1)", introduce a sanctioned "owner-authored content edit" category alongside PII redaction. It SHOULD (a) permit the owner to author or rewrite `about.content` (and, where directed, item descriptions) as content that intentionally departs from the predecessor import; (b) require recording each such edit in the leading YAML provenance comments with its date and a one-line description, mirroring the redaction ledger; (c) generalize the committed-snapshot re-pin discipline so that ANY recorded owner-authored edit — not only a PII redaction — re-pins the committed-snapshot SHA-256 in the provenance comments, `src/lib/data/import.test.ts`, and this spec; and (d) state that owner-authored content edits MAY change field values beyond character removal, in explicit contrast to the redaction rule. Keep the retrieved-source SHA-256 as immutable predecessor provenance.

## Proposal: about-field-governance-status-ambiguous

### Target specification files

- SPECIFICATION/spec.md

### Summary

§"Pinned production scope (parity is checkable)" counts `about` as one of the 18 pinned top-level keys, and §"Predecessor data model parity" treats `about` identically to the career sections (Job History, Formal Education, etc.), so `about.content` is frozen under the same data-and-behavior parity bar as employment facts. But `about.content` is self-referential commentary about the app itself — its tech stack, hosting, CI, and design — not a resume career fact. The spec never distinguishes "career data that must preserve predecessor parity" from "app self-description that should track the current implementation," so any correction to stale self-description reads as a parity regression under the current text.

### Motivation

The governance status of the `about` group is ambiguous: the spec applies a preserve-verbatim parity model to a field whose entire purpose is to describe the current app, an inconsistency that makes the owner's requested update indistinguishable from a prohibited parity break. Resolving this ambiguity is a prerequisite for the rewrite that this critique's other findings describe.

### Proposed Changes

In spec.md, carve `about.title` and the markdown `about.content` out of the strict predecessor-parity freeze as owner-authored app-meta content. State that `about` remains a pinned top-level key — the 18-key / 74-item production scope is unchanged structurally — but that its markdown BODY is owner-authored self-description that MUST track the current implementation rather than reproduce predecessor text; parity for `about` is structural (the key exists) not textual. Cross-reference the owner-authored-content-edit provision proposed in finding `owner-authored-about-edit-model-undefined`.

## Proposal: about-content-contradicts-current-architecture

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/README.md
- SPECIFICATION/non-functional-requirements.md

### Summary

The governed `about.content` (pinned by spec.md via the committed snapshot) states the app is "fully hosted on GitLab's infrastructure," built with "Vue.js served via Nuxt, Vuex for state management, bootstrap-vue for design, fuse.js ..., Jest/vue-jest," tracked on a GitLab issue board with GitLab CI/CD. README.md instead describes "a standalone TypeScript successor ... deployed on Vercel at resume.thewoolleyweb.com," and non-functional-requirements.md pins the Svelte/SvelteKit/Bun/Vitest/Playwright/Vercel/GitHub toolchain. Two ratified artifacts describe the SAME app's architecture in mutually exclusive terms, and a visitor reading the live About sees claims that are false for the current app.

### Motivation

The governed self-description contradicts the spec's own ratified architecture — a direct contradiction between the committed snapshot (pinned by spec.md) and README.md / non-functional-requirements.md. Per §"Predecessor data model parity", the predecessor's Nuxt 2 / Vuex / Bootstrap implementation details "remain historical references, not dependencies," but that design record speaks to the app's runtime dependencies, not to whether the governed `about.content` self-description must be corrected; no reachable design record reconciles the stale self-description with the current stack, so this finding surfaces that absence for the maintainer rather than presuming the shipped snapshot text is authoritative.

### Proposed Changes

Decide and record, in spec.md §"Governed data source and predecessor import (phase 1)", that the `about.content` app self-description MUST describe the CURRENT implementation (SvelteKit on Vercel, GitHub CI, Bun/Vitest/Playwright toolchain, AI/livespec-driven authoring) rather than the retired Vue/Nuxt/GitLab stack, while retaining a brief historical note that the resume was hand-coded in Vue in 2019 to land the GitLab role and converted to AI in 2026 via the owner's own livespec project and factory tooling. Update the infrastructure/tooling prose and the "Management, Build, Deploy, and Hosting" / "Source Code and Development" / "Tech/Tools" blocks accordingly. This is the concrete content the owner-authored-content-edit provision in finding `owner-authored-about-edit-model-undefined` would sanction; keep it concise and in the owner's existing voice.

## Proposal: cover-letter-surface-ungoverned-and-retired

### Target specification files

- SPECIFICATION/spec.md

### Summary

`about.content` links to a cover letter at `https://cover-letter.thewoolleyweb.com/` and frames the resume around applying to GitLab, but the spec never mentions a cover-letter surface — it is neither an operating mode (§"Operating modes"), a web route (contracts.md §"Web routes"), nor a governed fact with provenance. The owner is retiring that host, so the governed data would link to a dead external surface. §"Resume data" states that facts not present in the canonical source MUST NOT be exposed on any product surface, yet an outbound link to a now-defunct, ungoverned host is exposed via the About.

### Motivation

The cover-letter reference is an ungoverned, soon-dangling external link that the spec is silent on, leaving it unclear whether governed data may point at retired off-site surfaces — an inconsistency with the §"Resume data" governance rule. The owner has directed complete removal of the cover-letter references.

### Proposed Changes

In spec.md, (a) state that the governed `about.content` MUST NOT reference the retired cover-letter host `cover-letter.thewoolleyweb.com` or otherwise frame the resume as an application to a specific employer; and (b) confirm that removing these references is a sanctioned owner-authored content edit per finding `owner-authored-about-edit-model-undefined`. No new product surface is added — this is a removal plus a governance rule preventing governed data from linking to ungoverned or retired hosts.

## Proposal: visual-redesign-design-driver-undefined

### Target specification files

- SPECIFICATION/spec.md

### Summary

§"Delivery phases" → "Visual redesign" requires "a deliberate redesign rather than a reproduction of the predecessor's Bootstrap look" but is silent on WHAT drives the design. The predecessor's `about.content` "Design Mea Culpa" says the owner is "not a designer" and leaned on Bootstrap and bootstrap-vue; the owner now directs that the redesign is Claude-design-driven and wants the About to say so. The spec neither records the design-driver decision nor gives the About a spec-grounded basis for describing it.

### Motivation

The design methodology is undefined in the spec, leaving the About's design note ungrounded and the stale "not a designer / Bootstrap" self-description inconsistent with the current Claude-driven design approach the owner has directed.

### Proposed Changes

In spec.md §"Delivery phases" → "Visual redesign", add a short sentence recording that the deliberate redesign is Claude-design-driven (design carried out with Claude), without pinning specific visual choices. Correspondingly, the `about.content` design note SHOULD state, in the owner's concise voice, that the design is driven by Claude rather than hand-styled with Bootstrap — replacing the "Design Mea Culpa" block. This composes with the owner-authored-content-edit provision in finding `owner-authored-about-edit-model-undefined`.
