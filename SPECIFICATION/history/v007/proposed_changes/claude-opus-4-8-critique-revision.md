---
proposal: claude-opus-4-8-critique.md
decision: modify
revised_at: 2026-07-06T01:20:58Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Accepted all three sub-proposals in the claude-opus-4-8 critique. P1: pinned Svelte/SvelteKit as the app framework per the user's confirmed decision, replacing the open 'if the implementation chooses Next.js' wording so two implementers can no longer build the same product on incompatible stacks. P2 and P3: applied the placement and dedup cleanups the critique flagged — moved the two development-process bullets out of spec.md's functional Definition of Done into a pointer to non-functional-requirements.md, and reduced the duplicated ROP-enforcement-tooling sentence in constraints.md's Standalone boundary to a pointer at the authoritative NFR clause. Both target NFR sections already carry the canonical rules, so nothing was lost and the two-homes drift risk is removed.

## Modifications

P1 (Svelte pinning) reflects the user's confirmed framework decision, authored as concrete constraints.md text: 'Runtime and language' now names Svelte and SvelteKit's evergreen-browser baseline, and 'Framework and deployment' mandates Svelte with SvelteKit for routing/SSR/prerender deployed via the SvelteKit Vercel adapter, keeping constraints.md as the authoritative framework home and forbidding NFR from restating it. P2 kept two functional acceptance items in spec.md's Definition of Done and replaced the two process bullets (scenario-to-test mapping, quality gates) with a single pointer to NFR §'Definition of done for implementation work', §'Top-of-pyramid discipline', and §'Livespec governance'. P3 reduced the ROP-tooling sentence in constraints.md §'Standalone boundary' to a pointer at NFR §'Result and railway-oriented programming discipline'. non-functional-requirements.md is unchanged — it already holds the authoritative rules — so it is not in resulting_files. spec.md's high-level livespec-governance pointer was left as-is since it does not duplicate the new Definition-of-Done pointer.

## Resulting Changes

- spec.md
- constraints.md
