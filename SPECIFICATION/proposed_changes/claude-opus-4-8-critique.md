---
topic: claude-opus-4-8-critique
author: claude-opus-4-8
created_at: 2026-07-06T00:51:42Z
---

## Proposal: Framework choice left undefined; pin Svelte/SvelteKit

### Target specification files

- SPECIFICATION/constraints.md

### Summary

constraints.md §"Framework and deployment" and §"Runtime and language" describe the app framework only conditionally: line 5 defers to "the chosen Vercel-compatible framework" and line 9 says "If the implementation chooses Next.js, Vercel framework defaults SHOULD be used." Per the project's product-vs-process taxonomy, framework choice is a functional constraint that lives in constraints.md, and the project has now decided to standardize on Svelte. The spec should pin Svelte (with SvelteKit as the application framework realized via the Vercel adapter) rather than leaving the framework selectable.

### Motivation

The current wording leaves the delivered framework undefined and ambiguous — "the chosen framework" and "if… Next.js" let two implementers build the same product on incompatible stacks and both claim compliance. Naming a concrete framework removes that ambiguity and unblocks routing, SSR/prerender, and adapter decisions downstream (contracts.md §"Web routes" "framework-specific route groups", §"Static rendering contract" prerendering).

### Proposed Changes

In constraints.md §"Framework and deployment", replace the Next.js-conditional sentence with a normative decision: the app MUST be built with Svelte, using SvelteKit as the application framework for routing, server/edge rendering, and static prerendering, deployed to Vercel via the SvelteKit Vercel adapter; SvelteKit/Vercel framework defaults SHOULD be used unless a requirement makes a custom setup necessary. In §"Runtime and language", change "modern evergreen browsers supported by the chosen Vercel-compatible framework" to name Svelte/SvelteKit's supported evergreen-browser baseline. Keep the framework declaration in constraints.md (functional); non-functional-requirements.md §"Contributor toolchain" MAY reference Svelte's Vitest/Playwright integration but MUST NOT become the authoritative framework declaration. Leave AI/MCP provider and retrieval choices untouched — they remain deferred implementation choices per spec.md.

## Proposal: Process/quality-gate discipline misplaced in spec.md Definition of Done

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/non-functional-requirements.md

### Summary

spec.md §"Definition of Done" (lines 75-82) is a functional-spec section but two of its bullets are development-process / quality-gate discipline: "The behavior is covered by this specification or by an accepted proposed change" (livespec change-flow) and "Every scenario in scenarios.md affected by the change is mapped to an end-to-end or integration test" (test-pyramid discipline). Per the product-vs-process taxonomy (README §"Functional vs. non-functional"), those belong in non-functional-requirements.md, where they already exist in §"Livespec governance", §"Top-of-pyramid discipline", and §"Definition of done for implementation work". spec.md should keep only the functional acceptance criteria plus a pointer.

### Motivation

The same test-mapping and change-flow rules are stated in both spec.md and non-functional-requirements.md, which is inconsistent bookkeeping: two homes for one rule can drift into contradiction (e.g., spec.md says "end-to-end or integration test" while NFR §"Top-of-pyramid discipline" scopes the gate to §Scenario headings only). Consolidating the process rules in the non-functional file and leaving a pointer removes the duplication and the drift risk.

### Proposed Changes

In spec.md §"Definition of Done", remove the two process bullets (livespec-coverage and scenario→test mapping) and retain the functional acceptance items only — e.g. "The changed behavior is specified here or in an accepted proposed change" and "AI behavior remains grounded in governed resume data" — plus a single pointer: "Implementation completeness (test mapping, quality gates, Result/ROP enforcement) is governed by non-functional-requirements.md §\"Definition of done for implementation work\", §\"Top-of-pyramid discipline\", and §\"Livespec governance\"." Confirm non-functional-requirements.md already carries the canonical scenario→test-mapping and change-flow rules (it does) so nothing is lost in the move. Also trim the process framing in spec.md line 16 to a plain pointer if it now duplicates the new pointer.

## Proposal: Result/ROP enforcement tooling rule duplicated into constraints.md

### Target specification files

- SPECIFICATION/constraints.md
- SPECIFICATION/non-functional-requirements.md

### Summary

constraints.md §"Standalone boundary" (line 17) restates a non-functional quality-gate mechanic: "The Result and railway-oriented programming enforcement in non-functional-requirements.md §… MUST be realized with local TypeScript/Bun/Vercel-compatible tooling… and MUST NOT import livespec's Python enforcement suite." That same rule already exists verbatim-in-substance in non-functional-requirements.md §"Result and railway-oriented programming discipline" (line 145). The enforcement-tooling detail is process/quality-gate discipline and belongs solely in the non-functional file; constraints.md should keep only the architectural standalone rule and point at it.

### Motivation

Stating the ROP-enforcement-tooling constraint in two files is an inconsistency risk: if one copy is later relaxed or reworded, the two diverge and it becomes unclear which governs. The standalone architectural boundary (no runtime/build/CI dependency on sibling checkouts) is functional and correctly lives in constraints.md, but the specific "realize ROP enforcement with local tooling, not the Python suite" clause is a non-functional enforcement detail.

### Proposed Changes

In constraints.md §"Standalone boundary", reduce the ROP-enforcement sentence to a pointer, e.g. "Local realization of the Result/ROP enforcement gates under this boundary is specified in non-functional-requirements.md §\"Result and railway-oriented programming discipline\"." Keep the general standalone rule ("Any shared discipline imported from livespec-dev-tooling MUST be re-expressed as local TypeScript/Bun/Vercel tooling… Python-only fleet checks MUST NOT be required to build or run this app") in constraints.md. Ensure non-functional-requirements.md §"Result and railway-oriented programming discipline" retains the authoritative "local tooling, no Python enforcement suite" clause (it already does).
