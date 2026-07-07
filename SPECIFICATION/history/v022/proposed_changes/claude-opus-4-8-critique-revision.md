---
proposal: claude-opus-4-8-critique.md
decision: modify
revised_at: 2026-07-07T06:32:53Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: codex-gpt-5
---

## Decision and Rationale

The functional/product markdown critique is valid and load-bearing: the current contract says the renderer supports the markdown features the pinned production source uses, but the pinned source contains inline code spans that the contract and scenario omit. I verified the pinned source URL still has SHA-256 792097b01aef31fdc7cbf2c2463492e87c5ca89bc8d864ef3ebacfc7f7a4d158 and contains six backtick code spans, and verified the predecessor renderer uses marked 0.7.0, which renders inline code as code elements and autolinks bare http/https URLs while leaving trailing sentence punctuation outside the href. This modifies the proposal only to settle the bare-URL branch concretely instead of leaving it to the reviser: bare URLs are required predecessor-compatible autolinks. This does not re-litigate settled phase boundaries, coverage, or TDD mechanism decisions.

## Modifications

contracts.md §'Item rendering' now enumerates inline code spans and bare URL autolinks in the required markdown feature set pinned to the production source. It requires inline code spans to render as code elements and requires bare http/https URLs to autolink with predecessor-compatible trailing-punctuation handling. scenarios.md §'Markdown renders consistently across modes' now includes inline code and bare URL examples in the Given and asserts code-element rendering plus bare-URL link behavior in the Then.

## Resulting Changes

- contracts.md
- scenarios.md
