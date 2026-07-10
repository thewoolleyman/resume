---
topic: add-static-nav-link
author: claude-opus-4-8
created_at: 2026-07-10T17:40:00Z
---

## Proposal: Add a prominent Static link to the interactive nav

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

Add a Static control to the interactive navigation bar's trailing edge, after
About, that links to the `/static` route (the traditional static resume). Amend
contracts.md §"Layout and controls" (the control-order rule and the ASCII layout
sketch) and add a Static-link provision requiring a real, crawlable anchor;
extend the scenarios.md "Navigation shell collapses responsively" scenario to
name the Static link among the right-aligned trailing controls.

### Motivation

The interactive resume (`/`) and the static resume (`/static`) are both phase-1
surfaces (contracts.md §"Web routes"), but the interactive nav offered no visible
path to the static view — a visitor had to know the `/static` URL. The owner
wants a prominent, always-visible Static link in the nav so the printable/static
rendering is one click away. The previously pinned control order fixed the
trailing edge at Instructions/About, so adding a control there is a contract
change rather than an unspecified UI addition.

### Proposed Changes

In SPECIFICATION/contracts.md §"Layout and controls":

1. Update the ASCII layout sketch's trailing-controls line to include `[Static]`
   after `[About]`.
2. Amend the "Control order" bullet so the trailing edge is Instructions, About,
   and a Static link, in that order.
3. Add a "Static link" bullet: the trailing edge MUST include a Static control
   that navigates to `/static`; because it is a route link it MUST be a real
   anchor with an `href` to `/static` (works without JavaScript, crawlable),
   styled as a prominent nav affordance distinct from the toggle controls.

In SPECIFICATION/scenarios.md, extend the "Navigation shell collapses
responsively" scenario's Then clause so the wide-viewport inline controls include
Instructions, About, and the Static link (to `/static`) right-aligned. The
scenario title is unchanged, so its existing browser-observable mapping in
scenario-coverage.json remains valid; its mapped Playwright test is extended to
assert the Static link's presence and `href`.

No spec.md or constraints.md change is required. The Static link preserves every
existing behavioral, accessibility, responsive, and no-horizontal-scroll
requirement; on narrow viewports it collapses behind the Menu toggle with the
other controls.
