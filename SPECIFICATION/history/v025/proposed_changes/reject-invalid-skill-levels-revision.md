---
proposal: reject-invalid-skill-levels.md
decision: accept
revised_at: 2026-07-08T23:40:21Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Ratified maintainer decision (2026-07-09): invalid governed data is not allowed. A present item `level` that is not one of the five defined keys is malformed governed data that MUST be rejected at load (build/prerender failure, or the runtime visitor-safe error state), exactly like a missing group or a nameless item; the prior "invalid legacy level stays visible / unknown level" runtime tolerance is removed. The behavior change is co-edited atomically: the contracts.md clauses (§"Governed data source contract", §"Skill-level filtering", §"Item rendering") and the scenarios.md scenario move together, and the scenario is reclassified from browser-observable to a non-browser build/prerender rejection — mirroring "Malformed governed data is rejected at load" — resolving the governance conflict that no Playwright test could observe an invalid level against the pinned production data. The scenario-coverage.json mapping and check-scenarios.ts EXPECTED_CLASS pin are updated by the downstream implementing change.

## Resulting Changes

- spec.md
- contracts.md
- scenarios.md
