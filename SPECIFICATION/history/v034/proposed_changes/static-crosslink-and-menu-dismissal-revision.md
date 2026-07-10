---
proposal: static-crosslink-and-menu-dismissal.md
decision: accept
revised_at: 2026-07-11T00:15:00Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Owner-reported defects on the live site: the static resume's About called itself
"my interactive resume" and offered no path back to the interactive version, and
the nav dropdown menus stayed open after clicking elsewhere. Because the About
body is shared and rendered byte-identically in both modes, the per-mode framing
must live in view chrome, so the shared `about.content` opening line is
neutralized ("interactive resume" → "resume") — an owner-authored content edit
re-pinning the committed-snapshot SHA-256 — and `/static` gains a print-friendly
cross-link to the interactive resume carrying its full canonical URL. The nav
dropdowns now dismiss on outside pointer press, Escape, or focus loss. Structural
scope (18 keys / 16 sections / 74 items) is unchanged; no scenario change needed
(unit + e2e coverage added without weakening existing assertions).

## Resulting Changes

- spec.md (committed-snapshot SHA-256 re-pinned; 2026-07-11 about.content edit recorded)
- contracts.md (Web routes: static cross-link + shared-About framing rule; Layout and controls: nav menu dismissal)
- data/resume.yml (about.content opening line neutralized; provenance + SHA re-pinned)
- src/lib/data/import.test.ts (re-pinned SHA)
- src/lib/components/ResumeApp.svelte, StaticResume.svelte (menu dismissal; static cross-link) + tests
- e2e/navigation.e2e.ts, e2e/static-resume.e2e.ts (browser-observable coverage)
