---
proposal: codex-gpt-5-critique.md
decision: modify
revised_at: 2026-07-06T17:38:42Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: codex-gpt-5
---

## Decision and Rationale

Accept the critique's enforcement intent, but land it as a scoped non-functional revision. The concrete discipline artifact, CI workflow contract, E2E mapping rule, TypeScript/Svelte strictness baseline, property-test target list, and memory-pattern guardrail are contributor-process requirements, so the resulting spec update belongs in non-functional-requirements.md rather than mutating product spec files or the root AGENTS.md in this revise pass.

## Modifications

Merged all six findings into SPECIFICATION/non-functional-requirements.md. The revision pins `.ai/discipline-adoption.md` as the inventory artifact and defines its baseline rows/schema; strengthens top-of-pyramid coverage to require Playwright mappings for load-bearing functional scenarios; adds required GitHub CI workflow/status-check expectations; specifies TypeScript/Svelte strictness flags and generated SvelteKit type checking; enumerates mandatory phase-1 property/fuzz targets; and defines allowed `.ai/*.md` notes plus prohibited private-memory/tool-state patterns.

## Resulting Changes

- non-functional-requirements.md
