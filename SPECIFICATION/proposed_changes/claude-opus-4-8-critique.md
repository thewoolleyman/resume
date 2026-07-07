---
topic: claude-opus-4-8-critique
author: claude-opus-4-8
created_at: 2026-07-07T06:26:58Z
---

## Proposal: Required markdown feature set omits inline code the committed content uses

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

contracts.md §"Item rendering" -> "Markdown rendering and sanitization" and scenarios.md §"Markdown renders consistently across modes" both enumerate the renderer's required markdown features as "the markdown features the production content uses" — headings, unordered lists, paragraphs, emphasis and strong, and inline links (the scenario adds owner-authored raw HTML). But the committed production snapshot pinned in spec.md §"Governed data source and predecessor import (phase 1)" uses inline code spans (backtick code) that neither enumeration lists, so the required-feature set is factually incomplete against the very content it claims to cover.

### Motivation

FN-phase (functional/product) sweep of the four functional spec files. Verified against the hash-pinned production dataset (SHA-256 792097b0..., the exact snapshot spec.md pins) and the predecessor renderer: the committed content contains inline code in at least six places — `process_helper`, `preinitializer.rb`, `rails-core`, `git rebase -i $(git merge-base head master)`, `--no-ff`, and `thewoolleyman` — across the Open-Source Projects, Source Control, and Personal Info sections, and the predecessor's `marked ^0.7.0` renderer emits these as <code> elements. This is a load-bearing contradiction in the predecessor-parity contract, not a style nit: the clause frames its list as the features the content uses, yet omits one the content demonstrably uses. It does not re-litigate settled ground and touches neither the converged 100% coverage rule nor the TDD mechanism. Concrete failure: an implementation can satisfy the enumerated set literally while configuring a markdown renderer that renders `process_helper` as literal backtick text (or renders code spans differently between the two modes), which both breaks predecessor parity and violates the same section's 'byte-identical across modes' requirement — and because the consistency scenario never exercises inline code, tests built from these files pass while real content renders wrong.

### Proposed Changes

Reconcile the required-feature enumeration against the committed data/resume.yml content in both places. (1) In contracts.md §"Item rendering" -> "Markdown rendering and sanitization", ADD inline code to the enumerated feature set so the shared renderer MUST render backtick code spans as <code>, matching the predecessor, identically across interactive and static modes. (2) In scenarios.md §"Markdown renders consistently across modes", add inline code to the feature list in the Given and add a concrete inline-code example to the Then so cross-mode byte-identity is actually exercised for code spans (e.g., the `process_helper` span in the Open-Source Projects description). (3) Resolve bare-URL autolinking explicitly, since it shares the same root cause (the list was never reconciled with the content): the committed content contains many bare https:// URLs and the predecessor runs `marked ^0.7.0` with GFM defaults, so the reviser MUST verify whether the predecessor autolinks bare URLs and either add autolinked bare URLs to the required feature set or state that bare URLs render as plain text — not leave it implicit. Frame the enumeration as pinned to the actual committed content (an exhaustive list of the markdown features the snapshot uses), not an illustrative subset, so a future content addition that introduces an unlisted markdown feature is caught rather than silently unrendered.
