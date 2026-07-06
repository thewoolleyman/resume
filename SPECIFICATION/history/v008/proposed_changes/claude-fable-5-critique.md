---
topic: claude-fable-5-critique
author: claude-fable-5
created_at: 2026-07-06T01:37:25Z
---

## Proposal: Pin the governed data source: commit a production snapshot and define its concrete authoring schema

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md
- SPECIFICATION/constraints.md
- SPECIFICATION/scenarios.md

### Summary

Phase-1's most load-bearing deliverable — the single canonical governed data source — cannot be produced deterministically from the spec as written, so the port is not drive-able without out-of-band knowledge. The spec points only at the live external URL for the import material, gives only a normalized/derived conceptual shape rather than a concrete authoring schema, and never states whether the governed source file is authored in predecessor shape (and transformed at load) or authored directly in the contract's normalized shape. Two implementers would produce incompatible source files and both claim compliance.

### Motivation

User intent (/livespec:critique): focus on getting the basic port up now — the AI / MCP surfaces may be deferred for later deep refinement, but the re-implementation of the existing predecessor app (interactive + static resume modes) MUST be fully specified and drive-able. Carefully review the previous implementation at ../interactive-resume.gitlab.io and ensure everything needed to fully re-implement it is captured in the phase-1 functional specs. Findings below come from a line-by-line review of the predecessor source (store, util, components, nuxt.config.js, api, static) and its live production YAML content, compared against the current SPECIFICATION tree.

### Proposed Changes

Three concrete gaps, each with a fix:

(a) NO COMMITTED SNAPSHOT. spec.md and constraints.md require importing the predecessor's production content but reference only the external URL `https://interactive-resume-data-chad-woolley.gitlab.io/interactive-resume-data-chad-woolley.yml` — a GitLab Pages resource (verified reachable today, HTTP 200, 41719 bytes, Last-Modified 2022-06-27) that is outside repo control with no fallback if it disappears. Fix: commit a verbatim snapshot of that production YAML into the repo as the authoritative import material, and record its provenance (source URL, retrieval date, content hash) so phase-1 no longer depends on a live external fetch. Pin the observed production scope so parity is checkable: 18 top-level keys = `about`, `header`, and 16 sections; concrete section inventory IN ORDER = Job History; Formal Education; Open-Source Projects Created/Contributed; Writings, Publications, Presentations, and Awards; Skills/Tools - Methodologies/Processes; Skills/Tools - Frontend Languages/Libs/Frameworks; Skills/Tools - Backend Languages/Libs/Frameworks; Skills/Tools - Databases; Skills/Tools - DevOps/SecOps/OS/Sysadmin; Skills/Tools - Editors/IDEs; Skills/Tools - Remote Working; Skills/Tools - Networking; Skills/Tools - Source Control; Skills/Tools - Legacy/Mainframe; Favorite Books/Articles; Personal Info; 74 items total; skill levels actually used in production = played, once, often, toolbox, teach (NO `unspecified`-keyed items and NO invalid-level items appear in production — those two cases are defensive-only and come from the predecessor's dev/test fixture, which MUST NOT be imported).

(b) CONCRETE AUTHORING SCHEMA UNDEFINED. contracts.md §"Resume data contract" gives a normalized conceptual shape (`profile`/`sections`/`items`/`skills`/`relationships`/`metadata`) and says the source "parses to" it, but that is a derived shape, not an authoring shape, while spec.md's import field list is in the predecessor's authoring shape (top-level `about`/`header` maps plus arbitrary section keys whose KEY is the section display name, each mapping to an array of items `{name, level?, start?, end?, desc}`). Fix: choose and document ONE concrete authoring schema for the committed source file, with its documented path. Recommended: preserve the predecessor's human-friendly authoring shape (top-level `about`/`header` + ordered section keys → item arrays), since that is what the owner actually maintains, and specify the deterministic transform from that authoring shape into the Resume data contract at load. State explicitly that a section's display name IS its top-level key verbatim, and that item `title` == the predecessor `name` field.

(c) SOURCE-VS-CONTRACT SHAPE NOT RECONCILED. State unambiguously whether the on-disk governed SOURCE is the authoring shape (transformed to the contract shape at load) or the normalized contract shape, so parsing/loading code and the data file agree.

Add a phase-1 scenario asserting the committed governed source round-trips: loading it yields the pinned section inventory (names + order) and item count with every item's fields preserved.

## Proposal: Reconcile the data-load lifecycle (loading/fetch-failure states) with the SvelteKit prerender architecture

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/constraints.md
- SPECIFICATION/scenarios.md

### Summary

The Interactive rendering contract's Data-load lifecycle (shell -> loading indicator -> success -> failure -> hash reveal) and the scenarios "shows a loading indicator while data loads" and "renders when data loading fails" are inherited from the predecessor's architecture — a client-only SPA (`mode: 'spa'`) that fetches resume data over HTTP at runtime from an external URL. The new app's constraints mandate SvelteKit with prerendering/SSR over a committed in-repo data file. If that file is read at build/prerender time (the natural SvelteKit approach), there is no runtime async fetch, so the loading-indicator and fetch-failure states are unreachable in normal operation yet are specified as MUST and required to map to phase-1 acceptance tests — an unsatisfiable/dead requirement.

### Motivation

User intent (/livespec:critique): focus on getting the basic port up now — the AI / MCP surfaces may be deferred for later deep refinement, but the re-implementation of the existing predecessor app (interactive + static resume modes) MUST be fully specified and drive-able. Carefully review the previous implementation at ../interactive-resume.gitlab.io and ensure everything needed to fully re-implement it is captured in the phase-1 functional specs. Findings below come from a line-by-line review of the predecessor source (store, util, components, nuxt.config.js, api, static) and its live production YAML content, compared against the current SPECIFICATION tree.

### Proposed Changes

Reconcile the lifecycle with the chosen architecture and make each mapped scenario have a real trigger. Document one of:

(a) BUILD-TIME LOAD (recommended for a static personal site): declare the governed data read at build/prerender time so "success render" is the prerendered state; reclassify the loading-indicator and fetch-failure states as applying only to a documented runtime-fetch/hydration mode, or drop them from phase-1; and update the two affected scenarios so they assert only reachable behavior.

(b) RUNTIME FETCH: require the interactive route to fetch the governed source at runtime from a same-origin static asset, keeping the loading and fetch-failure states observable and testable (closest to predecessor behavior).

Either way, keep the parse-failure, transform-failure, and malformed-data (missing required group / nameless item) failure classes — those are reachable at build OR runtime regardless — and state which failure classes are observable in which mode so the failure-render scenarios remain mappable. Note that the predecessor rendered the raw error string to the visitor (an XSS/diagnostic leak); the new visitor-safe error state in §"Error payloads" is an intentional improvement and should stay.

## Proposal: Define the stable SECTION identifier derivation (currently only ITEM ids are defined)

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md

### Summary

The spec precisely defines stable ITEM identifiers (slug of section + item display names, with a documented collision rule) but never defines the stable SECTION identifier — even though contracts.md §"Layout and controls" requires Contents to "link to stable section anchors" and legacy `#list-<ordinal>` hashes to redirect to "the new stable section identifiers," and §"Interactive rendering contract" requires a per-section sticky-nav offset anchor. Without a derivation rule an implementer cannot deterministically form the canonical section anchor id, the Contents link targets, the offset-anchor element id, or the redirect target.

### Motivation

User intent (/livespec:critique): focus on getting the basic port up now — the AI / MCP surfaces may be deferred for later deep refinement, but the re-implementation of the existing predecessor app (interactive + static resume modes) MUST be fully specified and drive-able. Carefully review the previous implementation at ../interactive-resume.gitlab.io and ensure everything needed to fully re-implement it is captured in the phase-1 functional specs. Findings below come from a line-by-line review of the predecessor source (store, util, components, nuxt.config.js, api, static) and its live production YAML content, compared against the current SPECIFICATION tree.

### Proposed Changes

Define the stable section identifier with the SAME algorithm already specified for items: slugify the section display name (lowercase; collapse each run of non-alphanumeric characters to a single hyphen; trim leading/trailing hyphens) with the same deterministic `-2`/`-3` collision disambiguation in governed data order. State that this slug is the canonical section anchor, the Contents link target, and the section offset-anchor element id, while `#list-<ordinal>` remains a legacy alias/redirect (ordinal = the section's one-based position in governed data order). This matters concretely because the real production section names contain spaces, commas, slashes, and hyphens (e.g., "Open-Source Projects Created/Contributed" and ten "Skills/Tools - ..." sections that share long common prefixes), so slug formatting and collision handling are non-trivial and must be pinned. Add or extend a scenario asserting the section-slug derivation and its use by Contents and the offset anchor (in addition to the existing legacy-`#list-<ordinal>` scenario).

## Proposal: Mark skills-taxonomy, relationships, and rich metadata collections non-load-bearing in phase 1

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/spec.md

### Summary

The Resume data contract table lists `skills` ("skills, categories, and optional proficiency metadata"), `relationships` ("links between items, skills, roles, projects, or evidence"), and `metadata` as first-class collections, and spec.md §"Resume data" says the model MUST cover "Skills and skill levels" and "Cross-links between items ... such as skills used in a project." But the predecessor and the actual production content have none of these: skills are simply ordinary sections of items carrying a flat `level` field; there are no categories, no cross-item relationships, and no metadata. This leaves it ambiguous whether these are load-bearing phase-1 requirements or deferred like AI/MCP — and since phase-1 == predecessor parity, requiring them over-specifies phase-1 and invites an implementer to invent data with no governed source.

### Motivation

User intent (/livespec:critique): focus on getting the basic port up now — the AI / MCP surfaces may be deferred for later deep refinement, but the re-implementation of the existing predecessor app (interactive + static resume modes) MUST be fully specified and drive-able. Carefully review the previous implementation at ../interactive-resume.gitlab.io and ensure everything needed to fully re-implement it is captured in the phase-1 functional specs. Findings below come from a line-by-line review of the predecessor source (store, util, components, nuxt.config.js, api, static) and its live production YAML content, compared against the current SPECIFICATION tree.

### Proposed Changes

Explicitly scope these collections for phase 1, mirroring the clear non-load-bearing treatment already given to AI/MCP. State that in phase 1 the governed data model is exactly the predecessor's — `about`/`header` plus ordered sections of items with optional `level`/`start`/`end` and a markdown `desc` — and that skill levels ARE the item `level` field, NOT a separate skills taxonomy. Declare `skills` (as a taxonomy distinct from ordinary sections), `relationships`/cross-links, and any richer `metadata` beyond simple provenance to be OPTIONAL, forward-looking collections that MUST default to empty in phase 1 and MUST NOT be required for phase-1 completion. Keep them in the contract as clearly-marked deferred/optional fields so a future proposed change can activate them, exactly as AI and MCP are handled today.

## Proposal: Pin phase-1 markdown rendering semantics and the sanitization posture for owner-authored content

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/spec.md

### Summary

§"Item rendering" requires markdown in `about.content` and item `desc` to render consistently across modes "with sanitization rules documented before any untrusted content is admitted," and spec.md defers to "the sanitization rule in contracts.md" — but that rule is never actually defined, and the markdown feature set / renderer semantics needed for predecessor parity are unspecified. The predecessor renders with `marked` (v0.7) and NO sanitization, passing raw HTML through to `v-html`. The real production content leans heavily on markdown structure (headings like `## Cover Letter`, bulleted lists, inline links) though it currently contains no raw HTML tags. Because all phase-1 governed content is owner-authored (trusted), an implementer cannot tell whether to strip owner HTML or which markdown features must render, so two compliant implementations could diverge visibly from the predecessor.

### Motivation

User intent (/livespec:critique): focus on getting the basic port up now — the AI / MCP surfaces may be deferred for later deep refinement, but the re-implementation of the existing predecessor app (interactive + static resume modes) MUST be fully specified and drive-able. Carefully review the previous implementation at ../interactive-resume.gitlab.io and ensure everything needed to fully re-implement it is captured in the phase-1 functional specs. Findings below come from a line-by-line review of the predecessor source (store, util, components, nuxt.config.js, api, static) and its live production YAML content, compared against the current SPECIFICATION tree.

### Proposed Changes

(a) Pin the phase-1 sanitization posture: since all phase-1 content is governed/owner-authored (trusted), state whether raw HTML embedded in governed markdown is preserved (recommended, to match predecessor output) or stripped via a documented allowlist, and clarify that the "before any untrusted content is admitted" clause is a forward guard not triggered in phase 1 (all sources are governed). (b) Specify the minimum markdown feature parity required — at least headings, unordered lists, paragraphs, emphasis/strong, and links — matching the production content's actual usage, and require interactive and static modes to use the SAME renderer/config so output is byte-identical across modes. (c) Note that the search-time plain-text projection of descriptions (the predecessor's `searchableDesc`) must strip markdown/HTML WITHOUT a browser-DOM dependency, because the predecessor's `document.createElement('div')` strip does not exist during SvelteKit server/build rendering.

## Proposal: Specify (or explicitly waive) the predecessor start-date trailing separator in the date format

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

The date-rendering rule in §"Item rendering" specifies `M.YYYY`, `until`, and `current`, but omits a concrete predecessor rendering detail: a present start date is rendered as the month/year followed by a trailing separator — `M.YYYY` plus a non-breaking space and hyphen (`7.2001&nbsp;-`). This is verified by the predecessor's own test (`expect(wrapper.html()).toMatch('7.2001&nbsp;-')` and `/7.2001\s-\s8.2001/`). An implementer following the spec literally would render `7.2001` with no separator, visibly diverging from the predecessor's date column.

### Motivation

User intent (/livespec:critique): focus on getting the basic port up now — the AI / MCP surfaces may be deferred for later deep refinement, but the re-implementation of the existing predecessor app (interactive + static resume modes) MUST be fully specified and drive-able. Carefully review the previous implementation at ../interactive-resume.gitlab.io and ensure everything needed to fully re-implement it is captured in the phase-1 functional specs. Findings below come from a line-by-line review of the predecessor source (store, util, components, nuxt.config.js, api, static) and its live production YAML content, compared against the current SPECIFICATION tree.

### Proposed Changes

Decide and pin one option in §"Item rendering": either (a) require a present start date to render as `M.YYYY` followed by the predecessor's start/end separator (a non-breaking space + hyphen) so the date column matches the predecessor exactly, or (b) explicitly declare the separator styling between the start and the end/`current` positions a presentation choice the new app MAY change, so implementers are not left guessing. Update the "Item dates render in predecessor format" scenario to reflect the decision so it is testable. (Also confirm the precedence already implied but worth stating: when BOTH start and end are missing, the item renders `current` in the end position and NOTHING in the start position — this both-missing case overrides the missing-start -> `until` rule.)

## Proposal: Anchor search behavior with a deterministic worked example against the governed dataset

### Target specification files

- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

§"Search" deliberately leaves the matching algorithm an implementation choice (fuzzy/substring/token) as long as observable semantics hold. The predecessor used Fuse.js fuzzy search with specific tuning (`threshold: 0.1, tokenize: true, minMatchCharLength: 1`, keys = item name + markdown-stripped desc). With the algorithm unpinned and no worked example tied to the committed governed dataset, the "Visitor searches the interactive resume" and "Search matches markdown-stripped description text" scenarios cannot assert an exact expected result set, and two compliant implementations could return materially different matches — a gap for a scenario-to-test-mapped, drive-able phase 1.

### Motivation

User intent (/livespec:critique): focus on getting the basic port up now — the AI / MCP surfaces may be deferred for later deep refinement, but the re-implementation of the existing predecessor app (interactive + static resume modes) MUST be fully specified and drive-able. Carefully review the previous implementation at ../interactive-resume.gitlab.io and ensure everything needed to fully re-implement it is captured in the phase-1 functional specs. Findings below come from a line-by-line review of the predecessor source (store, util, components, nuxt.config.js, api, static) and its live production YAML content, compared against the current SPECIFICATION tree.

### Proposed Changes

Keep the algorithm open but add at least one deterministic worked example against the committed governed dataset: a specific query string mapped to the exact set (and canonical order) of items it MUST match and MUST NOT match, including one word that appears only inside markdown/HTML syntax (which MUST NOT match) and one plain-text prose word (which MUST match) — so the search scenarios map to concrete e2e assertions. Optionally bound acceptable fuzzy behavior with a minimum-match guarantee: a case-insensitive substring present in an item's display name or its markdown-stripped description MUST cause that item to match. Reaffirm the already-specified composition order (restrict to query matches -> skill-level filter -> per-section sort) and canonical-order (not relevance-ranked) result presentation.
