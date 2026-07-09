# AI-centric interactive resume

## Product intent

The application MUST be a modern reimplementation of Chad Woolley's interactive resume. It MUST preserve the core concept of the predecessor `../interactive-resume.gitlab.io`: a single-page interactive resume that presents structured resume data through browsable sections, searchable or filterable item lists, stable anchors, and a polished browser experience.

The application MUST add two surfaces beyond the predecessor:

- A traditional static-resume rendering mode that exposes the complete resume data in a printable and crawlable form.
- An AI-driven mode that presents a chat box where visitors can ask questions about Chad Woolley and receive answers grounded in the governed resume data.

The application MUST eventually expose an MCP server so external agents can query the governed resume data and supported question-answering surface without scraping the UI.

This repository is livespec-governed. The development workflow, contributor toolchain, and quality gates are non-functional concerns specified in `non-functional-requirements.md`.

## Delivery phases

Delivery is phased, and the phase boundary is load-bearing so implementers know exactly what the MVP requires. Phase 1 is the MVP: the first delivered milestone of this product.

**The MVP (phase 1).** The MVP MUST deliver the interactive and static resume modes with predecessor data and behavior parity, presented through a deliberately redesigned visual UI, deployed live, and reviewed. MVP completion requires ALL of the following:

- **Ported surfaces.** The interactive resume at `/` and the static resume at `/static`, satisfying the interactive and static contracts, constraints, and scenarios, over the governed data with predecessor data and behavior parity — the pinned production scope, the stable item and section identifiers, the search/filter/sort/collapse/reset behavior, the route and deep-link semantics, and the browser-metadata parity.
- **Visual redesign.** The MVP's visual presentation MUST be a deliberate redesign rather than a reproduction of the predecessor's Bootstrap look. Departing from the predecessor's visual appearance is expected and MUST NOT be treated as a parity regression; predecessor parity in the MVP is a data and behavior requirement, not a visual one (per §"Predecessor data model parity"). The redesign MUST preserve every load-bearing behavioral scenario in `scenarios.md` and the accessibility, responsive, and no-horizontal-scroll requirements in `constraints.md`.
- **Live across all environment classes.** The MVP MUST be deployed and reachable across all three environment classes defined in `contracts.md` §"Environment contract" — Development (local), Preview (Vercel branch or pull-request deployments), and Production (the public site at `https://resume.thewoolleyweb.com`) — not merely produce a local adapter build. Preview URLs remain non-indexed and non-canonical per `constraints.md` §"Framework and deployment".
- **Reviewed.** The deployed MVP MUST be reviewed against the running site by both automated/LLM reviewers and the maintainer before the MVP is considered complete. A green local `bun run check` is a precondition of, not a substitute for, this review.

MVP completion MUST NOT require an AI route, AI answering behavior, or an MCP surface.

**The later AI delivery (post-MVP).** AI-driven mode and the MCP server are a separate, later delivery, planned and implemented only after the MVP ships and is reviewed. They are NOT part of the MVP and MUST remain non-load-bearing until a future proposed change activates them; when that delivery is built it is held to the same live-and-reviewed bar as the MVP (deployed across all environment classes and reviewed on the running site). To keep the boundary unambiguous:

- The `/ai` route in `contracts.md` §"Web routes" is a later-delivery route. The MVP MAY omit it entirely or serve a documented placeholder; an MVP implementation MUST NOT be judged non-compliant for lacking AI behavior.
- The AI chat contract in `contracts.md` §"AI chat contract" and the Future MCP contract in `contracts.md` §"Future MCP contract" are later-delivery contracts.
- The AI and MCP scenarios in `scenarios.md` §"Later-phase scenarios (non-load-bearing in phase 1)" are later-delivery scenarios and MUST NOT be mapped to MVP acceptance tests.

An MVP implementation MUST NOT regress the interactive or static surfaces in order to stand up AI or MCP scaffolding.

## Operating modes

The product has three user-facing modes:

1. Interactive mode. The default web experience. It presents the resume as a single-page application with section navigation, item lists, rich detail views, and responsive layouts. This mode is part of the MVP (phase 1).
2. Static resume mode. This mode renders all governed resume data in a traditional resume format suitable for print, PDF capture, search engines, and readers that do not use client-side interactivity. This mode is part of the MVP (phase 1).
3. AI-driven mode. This mode presents a chat interface for asking questions about the resume owner. Answers MUST be grounded in governed resume data. When the app cannot answer from governed data, it MUST say so instead of inventing facts. This mode is a later, post-MVP delivery and non-load-bearing in phase 1 per §"Delivery phases".

## Resume data

Governed resume data is the set of resume facts stored in the repository's canonical structured data source. That source is the single source of truth for resume facts: it MUST be version-controlled, it MUST change only through the repository's normal review process, and its conceptual shape is the resume data contract in `contracts.md`. A supporting fact beyond the core resume becomes governed only by being added to the canonical data source. Facts not present in the canonical source are ungoverned and MUST NOT be cited, rendered, or exposed through any product surface, including the future MCP server.

Resume facts MUST be modeled as structured data, not as presentation-only markup. The same source data MUST drive interactive mode, static mode, AI mode, and the future MCP server.

The data model MUST cover at least these domains from the predecessor concept:

- Header and contact/profile summary information.
- Employment, projects, experience, or achievement items.
- Skill proficiency, expressed as an optional per-item skill level (the predecessor's item `level` field), NOT a separate skills taxonomy.
- Education, credentials, publications, talks, or other resume sections when present in governed data.

In phase 1 the governed data model is exactly the predecessor's: `about`/`header` plus ordered sections of items carrying an optional `level`, an optional `start`, an optional `end`, and a markdown description. A separate skills taxonomy (categories distinct from ordinary sections), cross-item relationships, and rich metadata beyond simple provenance are OPTIONAL, forward-looking collections that MUST default to empty in phase 1 and MUST NOT be required for phase-1 completion, exactly as AI-driven mode and the MCP server are deferred per §"Delivery phases". A later proposed change MAY activate them; until then a phase-1 implementation MUST NOT be judged non-compliant for leaving them empty and MUST NOT invent relationship or taxonomy data that has no governed source.

### Governed data source and predecessor import (phase 1)

Phase 1 MUST have exactly one canonical governed data source: `data/resume.yml`. It MUST be a single, version-controlled YAML document stored in this repository in a structured, human-readable, machine-parseable format. A phase-1 implementation MUST treat `data/resume.yml` as the authoritative source path and MUST NOT split resume facts across multiple competing source files.

**Authoring shape.** The canonical source MUST be authored in the predecessor's human-friendly authoring shape, not in the derived contract shape: top-level `about` and `header` maps plus an ordered set of arbitrary section keys, where each section KEY is the section display name verbatim and its value is an array of item maps of the form `{name, level?, start?, end?, desc}`. The on-disk source is therefore the authoring shape; the resume data contract in `contracts.md` §"Resume data contract" is the derived shape the source is deterministically transformed INTO at load, per `contracts.md` §"Governed data source contract". A section's display name IS its top-level key verbatim, and an item's contract `title` IS its authoring `name` field — one display label, not two.

**Committed production snapshot.** The predecessor's production resume content MUST be transcribed into `data/resume.yml` so predecessor parity is preserved rather than lost. The predecessor served its production content from an external YAML data source at `https://interactive-resume-data-chad-woolley.gitlab.io/interactive-resume-data-chad-woolley.yml`; that production content is the material to import, not the predecessor repository's development or test fixtures. A verbatim snapshot of that production content MUST be committed into `data/resume.yml` as the authoritative import material so phase 1 does not depend on a live external fetch, and the repository MUST record the snapshot's provenance in leading YAML comments in that same file: the source URL, the retrieval date, the upstream `Last-Modified` date, and a content hash of the retrieved bytes. The pinned provenance of the current snapshot is source `https://interactive-resume-data-chad-woolley.gitlab.io/interactive-resume-data-chad-woolley.yml`, retrieved 2026-07-06, upstream `Last-Modified` 2022-06-27, SHA-256 `792097b01aef31fdc7cbf2c2463492e87c5ca89bc8d864ef3ebacfc7f7a4d158`. The YAML data itself MUST still expose exactly the production top-level keys named in the pinned production-scope paragraph below; provenance comments MUST NOT add a parsed top-level data group.

**Pinned production scope (parity is checkable).** The committed snapshot MUST reproduce the observed production scope so predecessor parity can be asserted deterministically: exactly 18 top-level keys — `about`, `header`, and 16 sections — with the section inventory, in order, being Job History; Formal Education; Open-Source Projects Created/Contributed; Writings, Publications, Presentations, and Awards; Skills/Tools - Methodologies/Processes; Skills/Tools - Frontend Languages/Libs/Frameworks; Skills/Tools - Backend Languages/Libs/Frameworks; Skills/Tools - Databases; Skills/Tools - DevOps/SecOps/OS/Sysadmin; Skills/Tools - Editors/IDEs; Skills/Tools - Remote Working; Skills/Tools - Networking; Skills/Tools - Source Control; Skills/Tools - Legacy/Mainframe; Favorite Books/Articles; Personal Info; and 74 items in total across those sections. The only skill-level values appearing in production are `played`, `once`, `often`, `toolbox`, and `teach`; items without a `level` are the common case. A present item `level` MUST be one of those five defined keys; a present-but-non-defined level value — an explicit `unspecified` or any invalid legacy value — is malformed governed data that MUST be rejected at load (per contracts.md §"Governed data source contract"), failing the build/prerender under the phase-1 build-time load. Any legacy invalid level MUST be migrated to a valid level before it is loaded, rather than tolerated at runtime. A no-level item still behaves as `unspecified` for filtering and renders no badge; only present non-defined values are rejected.

The import MUST preserve, at minimum:

- `about.title` and the markdown `about.content`.
- `header.name` and `header.contact`.
- Every top-level resume section, its display name, and its order relative to the other sections.
- Within each section, every item, its order, its display name, its optional skill `level`, its optional `start` value, its optional `end` value, and its markdown description.

Dates in the governed source MUST be represented as ISO-8601 calendar dates (`YYYY-MM-DD`), optionally carrying a time component, and MUST be interpreted in UTC, matching the predecessor's date handling.

**Owner-authored markdown and sanitization posture.** Markdown is permitted in `about.content` and item descriptions. Because every phase-1 governed source is owner-authored and therefore trusted, raw HTML embedded in that governed markdown MUST be preserved and rendered — matching predecessor output — rather than stripped, per the sanitization rule in `contracts.md` §"Item rendering". The requirement to sanitize "before any untrusted content is admitted" is a forward guard for a future phase that admits non-owner content; it is NOT triggered in phase 1, where all sources are governed.

A governed source that is missing a required top-level group (`about` or `header`) or that contains a section item without a display name MUST be rejected — at build/prerender time under the phase-1 build-time load, or with a visitor-safe error under any runtime load path — per `contracts.md` §"Governed data source contract" and `contracts.md` §"Interactive rendering contract", rather than rendering partial or guessed data.

### Stable item identifiers

Each resume item MUST have a stable identifier. Stable identifiers MUST support anchored navigation, deterministic rendering order, tests, and future API/MCP references.

The predecessor data has no item identifiers, and the predecessor UI exposed only generated numeric section anchors of the form `#list-<ordinal>`. Phase-1 import MUST therefore derive each item's stable identifier deterministically from its section display name and its item display name. The composition is pinned to a single algorithm so that two independent implementations produce byte-identical item anchors:

1. **Slug each label independently.** Produce the item's **section slug** by slugifying its section display name, and the item's **title slug** by slugifying its item display name, each with the shared slugification algorithm: lowercase, collapse each run of non-alphanumeric characters to a single hyphen, and trim leading and trailing hyphens. The section slug used here is the section display name slugified by that algorithm — the **base** section slug, BEFORE any section-level `-2`/`-3` collision suffix from §"Stable section identifiers". Section-level collision suffixes MUST NOT participate in an item identifier, so that an item identifier is a pure function of its own section display name and item display name and does not shift when an unrelated section is added, removed, or reordered.
2. **Join with a single hyphen.** The base item identifier is the section slug, then a single literal hyphen `-`, then the title slug (`<section-slug>-<title-slug>`).
3. **Disambiguate collisions on the composed identifier.** When two items in the same governed source produce the same base item identifier, the identifier MUST be disambiguated deterministically by appending `-2`, `-3`, and so on to the fully composed identifier in governed data order. The item-level suffix is appended AFTER the join, never inside the title slug.

Worked example (from the pinned production dataset): the `Senior Software Engineer, Pivotal` item in the `Job History` section has base section slug `job-history` and title slug `senior-software-engineer-pivotal`, composing to the item identifier and public anchor `job-history-senior-software-engineer-pivotal`.

Item identifiers derived this way MUST be stable across content reordering, because they derive from names rather than positions, and MUST change only when the item's section display name or item display name changes — the sole exception being the deterministic `-2`/`-3` collision suffix, which resolves genuine composed-identifier collisions in governed data order. Item anchors MUST be public and deep-linkable. The new per-item anchors are additive over the predecessor; the legacy generated `#list-<ordinal>` section anchors MUST still be preserved as aliases or resolved through deterministic redirects per `contracts.md` §"Layout and controls".

### Stable section identifiers

Each resume section MUST also have a stable identifier, derived with the SAME algorithm specified for items: slugify the section display name by lowercasing, collapsing each run of non-alphanumeric characters to a single hyphen, and trimming leading and trailing hyphens. When two sections in the same governed source derive the same slug, the identifier MUST be disambiguated deterministically by appending `-2`, `-3`, and so on in governed data order.

This section slug is the canonical section anchor, the target of every Contents link, and the id of the section's sticky-nav offset anchor, per `contracts.md` §"Layout and controls". The legacy generated `#list-<ordinal>` section anchor — where `<ordinal>` is the section's one-based position in governed data order — MUST remain available as an alias of, or a deterministic redirect to, the section slug. Section identifiers derived this way MUST be stable across content reordering and MUST change only when the section display name changes.

Deterministic derivation is load-bearing because the production section names contain spaces, commas, slashes, and hyphens (for example "Open-Source Projects Created/Contributed" and the ten "Skills/Tools - ..." sections that share long common prefixes), so slug formatting and collision handling are not trivial and MUST be pinned.

### Predecessor data model parity

The governed resume data MUST preserve the predecessor's conceptual data model unless a later proposed change explicitly migrates it. Expressed in the vocabulary of the resume data contract in `contracts.md`, the model MUST include:

- An `about` group with a title and markdown content (`about.title`, markdown `about.content`).
- A `header` group with the owner name and contact/profile data (`header.name`, `header.contact`).
- An ordered set of arbitrary named resume sections derived from the remaining top-level data groups. Each section's display name MUST be the governed data group's name. Sections MUST render in governed data order, and each section's items MUST render in governed data order by default. Each item MUST carry a stable identifier (per §"Stable item identifiers" above) plus at least a display name, an optional skill level, an optional start value, an optional end value, and a markdown description. The item's display name is the same field the contract calls the item title; the predecessor's `name` field and the contract's `title` field denote one display label, not two.

The production content imported from the predecessor MUST preserve the predecessor's concrete section inventory unless intentionally revised through a later proposed change. The authoritative section inventory is the exact pinned production scope in §"Governed data source and predecessor import (phase 1)"; this parity section deliberately does not maintain a second section list.

This section pins the conceptual shape and inventory to preserve predecessor workflows; it does not require the new implementation to reuse the predecessor's Vuex state shape, YAML parsing, Fuse.js search behavior, Bootstrap styling, or Nuxt 2 implementation. Those remain historical references, not dependencies. Accordingly, the MVP deliberately redesigns the visual presentation per §"Delivery phases"; predecessor parity is a data and behavior requirement, and a redesigned visual appearance is expected rather than a parity regression.

## AI answering behavior

AI answering behavior is a later-phase surface and is non-load-bearing in phase 1 per §"Delivery phases". The requirements below become load-bearing only when a future proposed change activates AI-driven mode.

AI answers MUST be grounded in the governed resume data available to the application. The answerer MUST expose enough source attribution in the UI or answer metadata for a visitor to understand which resume facts support the response.

The AI mode MUST distinguish the four response statuses defined by the AI chat contract in `contracts.md`:

- `answered`. The app returns a concise answer grounded in governed resume data.
- `partial`. The app states the supported portion and identifies what is not covered by governed data.
- `unanswerable`. The app refuses to fabricate and explains that the governed resume data does not contain the requested fact.
- `declined`. The app declines the request per the decline rules below.

The app MUST decline requests that are off-topic for the resume owner, that request private data beyond governed facts, or that attempt to manipulate the answerer into ignoring its grounding rules. A declined response MUST state its reason category and MUST NOT fabricate resume facts.

The specific model provider, retrieval implementation, prompt format, and storage backend are implementation choices until a future proposed change makes them load-bearing. Any provider-specific configuration MUST stay outside the public client bundle.

## MCP behavior

The MCP server is a later-phase planned product surface and is non-load-bearing in phase 1 per §"Delivery phases". When implemented, it MUST expose governed resume data and supported question-answering capabilities through stable tools or resources. It MUST NOT expose secrets, private local files, deployment credentials, or ungoverned memory.

The MCP server MAY share the same data-access and answer-grounding modules as the web app. It MUST NOT require the browser UI to run.

## Definition of Done

A change to the AI-centric interactive resume MUST satisfy this Definition of Done before merge:

- The changed behavior is specified here or in an accepted proposed change.
- AI behavior, when activated in a later phase, remains grounded in governed resume data.

Implementation completeness — scenario-to-test mapping, quality gates, and Result/ROP enforcement — is governed by `non-functional-requirements.md` §"Definition of done for implementation work", §"Top-of-pyramid discipline", and §"Livespec governance".

## Non-goals

The initial product spec does not require a native mobile application, private recruiter portal, analytics dashboard, or general-purpose chatbot unrelated to the resume.
