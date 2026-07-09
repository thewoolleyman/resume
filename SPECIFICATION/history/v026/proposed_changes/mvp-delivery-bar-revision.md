---
proposal: mvp-delivery-bar.md
decision: accept
revised_at: 2026-07-09T21:09:50Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Ratified maintainer decision (2026-07-09): redefine the MVP (phase 1) as the predecessor site ported to data and behavior parity PLUS a deliberate visual redesign, deployed live and reachable across all three environment classes (Development, Preview, and Production at https://resume.thewoolleyweb.com), and reviewed on the running site by both automated/LLM reviewers and the maintainer. MVP completion requires all of those; a green local build is a precondition, not a substitute. AI-driven mode and the MCP server are made an explicitly separate, later post-MVP delivery held to the same live-and-reviewed bar, not a phase-2 bundled into the MVP. The existing hard boundary is preserved: MVP completion MUST NOT require an AI route, AI answering behavior, or an MCP surface. The load-bearing 'phase 1' token is retained throughout ('Phase 1 is the MVP') so predecessor-parity, governed-data, identifier, and scenario requirements and the guardrail gates keyed off that token are unaffected. Predecessor parity is clarified as a data and behavior requirement, not a visual one, so the redesign is expected rather than a regression. No AI or MCP behavior is activated. Edits: spec.md (rewrite Delivery phases; clarify Operating modes and Predecessor data model parity) and constraints.md (require live deployment across all environment classes for MVP completion in Framework and deployment).

## Resulting Changes

- spec.md
- constraints.md
