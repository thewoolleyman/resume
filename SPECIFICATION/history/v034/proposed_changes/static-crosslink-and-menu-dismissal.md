---
topic: static-crosslink-and-menu-dismissal
author: claude-opus-4-8
created_at: 2026-07-11T00:10:00Z
---

## Proposal: Static→interactive cross-link, neutral shared About, and nav menu dismissal

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md

### Summary

Three coupled fixes to the running MVP: (1) the shared owner-authored
`about.content` opening line is neutralized from "my interactive resume" to "my
resume" so it reads correctly on the static view (which renders the same About
body byte-identically), re-pinning the committed-snapshot SHA-256; (2)
contracts.md §"Web routes" requires the static resume (`/static`) to carry a
print-friendly cross-link back to the interactive resume rendered as its full
canonical URL, and forbids the shared About body from framing itself as only one
mode; (3) contracts.md §"Layout and controls" requires the nav dropdown menus
(Contents, Skill Levels) to dismiss on outside pointer press, Escape, or focus
loss rather than staying open until re-toggled.

### Motivation

On the deployed static resume the About opened with "This is my (Chad Woolley's)
interactive resume…", which is wrong on the static page and gave a visitor no way
back to the interactive version. Separately, the Contents/Skill Levels dropdowns
stayed open after the visitor clicked elsewhere. Both are owner-reported defects
on the live site. The About body is shared and rendered byte-identically across
modes (contracts.md §"Item rendering"), so per-mode framing must live in view
chrome (the cross-link), not in the shared About text — hence the neutralization
plus the cross-link requirement.

### Proposed Changes

1. SPECIFICATION/spec.md §"Governed data source and predecessor import (phase 1)":
   re-pin the committed-snapshot SHA-256 to
   `61e2b2ca076b56686a871854eff3b31f37b9c484ef7727c44f652e2675d4a78a` and record
   the 2026-07-11 owner-authored edit neutralizing the `about.content` opening
   line ("interactive resume" → "resume"). Re-pin the same hash in the file's
   provenance comments and in `src/lib/data/import.test.ts`. Pinned production
   scope (18 keys / 16 sections / 74 items) is unchanged.

2. SPECIFICATION/contracts.md §"Web routes": add a paragraph requiring `/static`
   to include a link back to `/` rendered as the interactive resume's full
   canonical URL (so a printed/PDF copy stays actionable), and stating the shared
   `about.content` MUST NOT frame the resume as belonging to only one mode; the
   mode-specific framing is carried by the cross-link chrome.

3. SPECIFICATION/contracts.md §"Layout and controls": amend the
   "Sticky, responsive navigation bar" bullet so any dropdown menu the bar
   exposes (Contents, Skill Levels) MUST dismiss on an outside pointer press, the
   Escape key, or focus moving away from the menu.

No scenarios.md change is required: these refine existing controls and the static
rendering without adding a load-bearing scenario; the behaviors are covered by
unit tests (ResumeApp, StaticResume) and browser-observable e2e (navigation,
static-resume) without weakening any existing assertion.
