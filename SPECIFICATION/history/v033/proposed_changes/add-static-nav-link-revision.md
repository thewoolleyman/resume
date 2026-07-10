---
proposal: add-static-nav-link.md
decision: accept
revised_at: 2026-07-10T17:45:00Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

The owner directed adding a prominent, always-visible Static link to the
interactive nav so the `/static` printable rendering is one click away rather
than requiring knowledge of the URL. The pinned control order fixed the trailing
edge at Instructions/About, so this is a contract change: contracts.md §"Layout
and controls" now places a Static link (a real crawlable `href="/static"` anchor)
at the trailing edge after About, and the "Navigation shell collapses
responsively" scenario names it among the right-aligned inline controls. The
change is additive and preserves every behavioral, a11y, responsive, and
no-horizontal-scroll requirement; the link collapses behind the Menu toggle on
narrow viewports. Landed together with the Claude-driven visual redesign
(self-hosted Geist, hand-rolled light/dark design tokens) so the redesigned nav
carries the new control.

## Resulting Changes

- contracts.md (Layout and controls: control order, ASCII sketch, Static-link provision)
- scenarios.md (Navigation shell collapses responsively: Static link named)
