---
proposal: permit-owner-directed-career-item-edits.md
decision: accept
revised_at: 2026-07-10T17:20:00Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Owner/maintainer directed a real-world career update to the current GitLab role on
2026-07-10: retitle Senior→Staff Fullstack Engineer, add the `2026-06-15` end date
(owner was laid off), and rewrite the description. The previously sanctioned
owner-authored content-edit category covered `about` fields and individual item
descriptions only, not an item's display `name` or `start`/`end` dates. This amendment
extends the category to owner-directed edits of an item's factual fields (display name,
start, end, description), re-pinning the committed-snapshot hash while preserving the
pinned production scope (18 keys / 16 sections / 74 items). Editing the display name
re-derives the item's stable anchor per §"Stable item identifiers", which is intended.
No contract/scenario change is needed; the missing-end sort and date-rendering e2e
examples are re-pointed to still-open-ended items so those behaviors stay exercised.

## Resulting Changes

- spec.md
- data/resume.yml (committed-snapshot re-pinned; GitLab item name/end/description)
- src/lib/data/import.test.ts (re-pinned SHA; GitLab lookup + end assertion)
- e2e/sort.e2e.ts, e2e/search.e2e.ts, e2e/rendering.e2e.ts, e2e/interactive-resume.e2e.ts
