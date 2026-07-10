---
proposal: claude-opus-4-8-critique.md
decision: modify
revised_at: 2026-07-10T03:48:25Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Accept the substance of all five findings in this critique: together they identify a real, live defect (the About panel on the running Production site still links the retired cover-letter host and describes the retired Vue/Nuxt/GitLab/Bootstrap stack) and the spec gap that blocked fixing it (only PII redactions were sanctioned; owner-authored content edits had no editing model). Landing them establishes an owner-authored-content-edit category alongside PII redaction, carves about.title/about.content out of the strict textual predecessor-parity freeze as structurally-pinned owner-authored app-meta, requires about.content to track the current implementation with a brief 2019->2026 historical note, forbids referencing the retired cover-letter host, and records that the MVP redesign is Claude-design-driven. The maintainer confirmed and directed this rewrite on 2026-07-10.

## Modifications

Consolidated the five separately-targeted proposals into coherent edits landing in spec.md ONLY, because README.md and non-functional-requirements.md already describe the current SvelteKit/Vercel/GitHub stack correctly — the contradiction lives entirely in the governed about.content data, whose fix is the separate data rewrite that this revise pass's committed-snapshot SHA re-pin (to d6c29374…) reflects. Edits: (1) §"Delivery phases" Visual redesign records the redesign is Claude-design-driven without pinning visual choices [visual-redesign-design-driver-undefined]; (2) §"Governed data source and predecessor import (phase 1)" Committed production snapshot adds the owner-authored-content-edit category, generalizes the SHA re-pin discipline to any recorded edit, keeps the retrieved-source hash immutable, and re-pins committed-snapshot SHA-256 [owner-authored-about-edit-model-undefined]; (3) a new About app-meta content (owner-authored) provision carves about.title/content out of textual parity (structural parity retained), requires about.content to describe the current stack with a 2019->2026 historical note, and forbids the retired cover-letter reference and employer-application framing [about-field-governance-status-ambiguous, about-content-contradicts-current-architecture, cover-letter-surface-ungoverned-and-retired]; (4) cross-references added to the import-preserve list and §"Predecessor data model parity". README.md and non-functional-requirements.md are intentionally NOT modified; no scenario or contract change is needed (mirroring the v027 PII-redaction precedent).

## Resulting Changes

- spec.md
