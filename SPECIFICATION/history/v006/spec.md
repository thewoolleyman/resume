# AI-centric interactive resume

## Product intent

The application MUST be a modern reimplementation of Chad Woolley's interactive resume. It MUST preserve the core concept of the predecessor `../interactive-resume.gitlab.io`: a single-page interactive resume that presents structured resume data through browsable sections, searchable or filterable item lists, stable anchors, and a polished browser experience.

The application MUST add two surfaces beyond the predecessor:

- A traditional static-resume rendering mode that exposes the complete resume data in a printable and crawlable form.
- An AI-driven mode that presents a chat box where visitors can ask questions about Chad Woolley and receive answers grounded in the governed resume data.

The application MUST eventually expose an MCP server so external agents can query the governed resume data and supported question-answering surface without scraping the UI.

This repository is livespec-governed. The development workflow, contributor toolchain, and quality gates are non-functional concerns specified in `non-functional-requirements.md`.

## Delivery phases

Delivery is phased, and the phase boundary is load-bearing so implementers know exactly what phase-1 completion requires.

Phase 1 MUST deliver the interactive and static resume modes with predecessor parity fully specified and drive-able before implementation begins. Phase-1 completion is defined entirely by the interactive and static contracts, constraints, and scenarios; it MUST NOT require an AI route, AI answering behavior, or an MCP surface.

AI-driven mode and the MCP server are later-phase planned product surfaces. Their detailed retrieval, provider, tool, and protocol behavior is deferred, and every AI and MCP requirement in this specification MUST remain non-load-bearing until a future proposed change activates it. To keep the phase boundary unambiguous:

- The `/ai` route in `contracts.md` §"Web routes" is a later-phase route. Phase 1 MAY omit it entirely or serve a documented placeholder; a phase-1 implementation MUST NOT be judged non-compliant for lacking AI behavior.
- The AI chat contract in `contracts.md` §"AI chat contract" and the Future MCP contract in `contracts.md` §"Future MCP contract" are later-phase contracts.
- The AI and MCP scenarios in `scenarios.md` §"Later-phase scenarios (non-load-bearing in phase 1)" are later-phase scenarios and MUST NOT be mapped to phase-1 acceptance tests.

A phase-1 implementation MUST NOT regress the interactive or static surfaces in order to stand up AI or MCP scaffolding.

## Operating modes

The product has three user-facing modes:

1. Interactive mode. The default web experience. It presents the resume as a single-page application with section navigation, item lists, rich detail views, and responsive layouts. This mode is phase-1.
2. Static resume mode. This mode renders all governed resume data in a traditional resume format suitable for print, PDF capture, search engines, and readers that do not use client-side interactivity. This mode is phase-1.
3. AI-driven mode. This mode presents a chat interface for asking questions about the resume owner. Answers MUST be grounded in governed resume data. When the app cannot answer from governed data, it MUST say so instead of inventing facts. This mode is later-phase and non-load-bearing in phase 1 per §"Delivery phases".

## Resume data

Governed resume data is the set of resume facts stored in the repository's canonical structured data source. That source is the single source of truth for resume facts: it MUST be version-controlled, it MUST change only through the repository's normal review process, and its conceptual shape is the resume data contract in `contracts.md`. A supporting fact beyond the core resume becomes governed only by being added to the canonical data source. Facts not present in the canonical source are ungoverned and MUST NOT be cited, rendered, or exposed through any product surface, including the future MCP server.

Resume facts MUST be modeled as structured data, not as presentation-only markup. The same source data MUST drive interactive mode, static mode, AI mode, and the future MCP server.

The data model MUST cover at least these domains from the predecessor concept:

- Header and contact/profile summary information.
- Employment, projects, experience, or achievement items.
- Skills and skill levels.
- Education, credentials, publications, talks, or other resume sections when present in governed data.
- Cross-links between items where one resume item supports another, such as skills used in a project.

### Governed data source and predecessor import (phase 1)

Phase 1 MUST have exactly one canonical governed data source. It MUST be a single, version-controlled document stored in this repository in a structured, human-readable, machine-parseable format (for example YAML or JSON), whose parsed shape realizes the resume data contract in `contracts.md` §"Resume data contract". The repository MUST document the canonical source path so there is no ambiguity about which file is authoritative; a phase-1 implementation MUST NOT split resume facts across multiple competing source files.

The predecessor's production resume content MUST be transcribed into that governed source so predecessor parity is preserved rather than lost. The predecessor served its production content from an external YAML data source at `https://interactive-resume-data-chad-woolley.gitlab.io/interactive-resume-data-chad-woolley.yml`; that production content is the material to import, not the predecessor repository's development/test fixtures. The import MUST preserve, at minimum:

- `about.title` and the markdown `about.content`.
- `header.name` and `header.contact`.
- Every top-level resume section, its display name, and its order relative to the other sections.
- Within each section, every item, its order, its display name, its optional skill `level`, its optional `start` value, its optional `end` value, and its markdown description.

Dates in the governed source MUST be represented as ISO-8601 calendar dates (`YYYY-MM-DD`), optionally carrying a time component, and MUST be interpreted in UTC, matching the predecessor's date handling. Markdown is permitted in `about.content` and item descriptions; any raw HTML embedded in that markdown MUST be handled under the sanitization rule in `contracts.md` §"Item rendering" before untrusted content is admitted. A governed source that is missing a required top-level group (`about` or `header`) or that contains a section item without a display name MUST be rejected at load with a visitor-safe error per `contracts.md` §"Interactive rendering contract" rather than rendering partial or guessed data.

### Stable item identifiers

Each resume item MUST have a stable identifier. Stable identifiers MUST support anchored navigation, deterministic rendering order, tests, and future API/MCP references.

The predecessor data has no item identifiers, and the predecessor UI exposed only generated numeric section anchors of the form `#list-<ordinal>`. Phase-1 import MUST therefore derive each item's stable identifier deterministically from its section display name and its item display name, slugified by lowercasing, collapsing each run of non-alphanumeric characters to a single hyphen, and trimming leading and trailing hyphens. When two items in the same governed source derive the same slug, the identifier MUST be disambiguated deterministically by appending `-2`, `-3`, and so on in governed data order.

Item identifiers derived this way MUST be stable across content reordering, because they derive from names rather than positions, and MUST change only when the item's section display name or item display name changes. Item anchors MUST be public and deep-linkable. The new per-item anchors are additive over the predecessor; the legacy generated `#list-<ordinal>` section anchors MUST still be preserved as aliases or resolved through deterministic redirects per `contracts.md` §"Layout and controls".

### Predecessor data model parity

The governed resume data MUST preserve the predecessor's conceptual data model unless a later proposed change explicitly migrates it. Expressed in the vocabulary of the resume data contract in `contracts.md`, the model MUST include:

- An `about` group with a title and markdown content (`about.title`, markdown `about.content`).
- A `header` group with the owner name and contact/profile data (`header.name`, `header.contact`).
- An ordered set of arbitrary named resume sections derived from the remaining top-level data groups. Each section's display name MUST be the governed data group's name. Sections MUST render in governed data order, and each section's items MUST render in governed data order by default. Each item MUST carry a stable identifier (per §"Stable item identifiers" above) plus at least a display name, an optional skill level, an optional start value, an optional end value, and a markdown description. The item's display name is the same field the contract calls the item title; the predecessor's `name` field and the contract's `title` field denote one display label, not two.

The production content imported from the predecessor MUST preserve the predecessor's concrete section inventory unless intentionally revised through a later proposed change: Job History, Formal Education, Open-Source Projects Created/Contributed, Writings/Publications/Presentations/Awards, the Skills/Tools section families, Favorite Books/Articles, and Personal Info.

This section pins the conceptual shape and inventory to preserve predecessor workflows; it does not require the new implementation to reuse the predecessor's Vuex state shape, YAML parsing, Fuse.js search behavior, Bootstrap styling, or Nuxt 2 implementation. Those remain historical references, not dependencies.

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

- The behavior is covered by this specification or by an accepted proposed change.
- Every scenario in `scenarios.md` affected by the change is mapped to an end-to-end or integration test, except later-phase scenarios that remain non-load-bearing per §"Delivery phases".
- The implementation quality gates in `non-functional-requirements.md` §"Definition of done for implementation work" pass.
- AI behavior, when activated in a later phase, remains grounded in governed resume data.

## Non-goals

The initial product spec does not require a native mobile application, private recruiter portal, analytics dashboard, or general-purpose chatbot unrelated to the resume.
