---
proposal: local-secret-injection-wrapper.md
decision: accept
revised_at: 2026-07-08T02:04:18Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-fable-5
---

## Decision and Rationale

Maintainer-directed work item li-2o7eza requires the pull-request landing automation to become operational via the standard 1Password env-wrapper pattern, with docs and harness mandating wrapper usage for secret-needing local commands. The NFR already requires provisioning APP_ID/APP_PRIVATE_KEY but names no local injection mechanism; specifying the committed wrapper before docs and gates rely on it keeps the repo livespec-first. The proposal is contributor-only (correct non-functional placement), preserves the standalone boundary (committed wrapper is self-contained; only re-rendering needs the factory), keeps the default check secret-free, and carries its own contributor-workflow scenario in this file's Scenarios section per the file's convention (satisfied by repository configuration, not Playwright).

## Resulting Changes

- non-functional-requirements.md
