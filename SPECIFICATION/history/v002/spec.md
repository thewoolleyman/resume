# AI-centric interactive resume

## Product intent

The application MUST be a modern reimplementation of Chad Woolley's interactive resume. It MUST preserve the core concept of the predecessor `../interactive-resume.gitlab.io`: a single-page interactive resume that presents structured resume data through browsable sections, searchable or filterable item lists, stable anchors, and a polished browser experience.

The application MUST add two surfaces beyond the predecessor:

- A traditional static-resume rendering mode that exposes the complete resume data in a printable and crawlable form.
- An AI-driven mode that presents a chat box where visitors can ask questions about Chad Woolley and receive answers grounded in the governed resume data.

The application MUST eventually expose an MCP server so external agents can query the governed resume data and supported question-answering surface without scraping the UI.

This repository is livespec-governed. The development workflow, contributor toolchain, and quality gates are non-functional concerns specified in `non-functional-requirements.md`.

## Operating modes

The product has three user-facing modes:

1. Interactive mode. The default web experience. It presents the resume as a single-page application with section navigation, item lists, rich detail views, and responsive layouts.
2. Static resume mode. This mode renders all governed resume data in a traditional resume format suitable for print, PDF capture, search engines, and readers that do not use client-side interactivity.
3. AI-driven mode. This mode presents a chat interface for asking questions about the resume owner. Answers MUST be grounded in governed resume data. When the app cannot answer from governed data, it MUST say so instead of inventing facts.

## Resume data

Governed resume data is the set of resume facts stored in the repository's canonical structured data source. That source is the single source of truth for resume facts: it MUST be version-controlled, it MUST change only through the repository's normal review process, and its conceptual shape is the resume data contract in `contracts.md`. A supporting fact beyond the core resume becomes governed only by being added to the canonical data source. Facts not present in the canonical source are ungoverned and MUST NOT be cited, rendered, or exposed through any product surface, including the future MCP server.

Resume facts MUST be modeled as structured data, not as presentation-only markup. The same source data MUST drive interactive mode, static mode, AI mode, and the future MCP server.

Each resume item MUST have a stable identifier. Stable identifiers MUST support anchored navigation, deterministic rendering order, tests, and future API/MCP references.

The data model MUST cover at least these domains from the predecessor concept:

- Header and contact/profile summary information.
- Employment, projects, experience, or achievement items.
- Skills and skill levels.
- Education, credentials, publications, talks, or other resume sections when present in governed data.
- Cross-links between items where one resume item supports another, such as skills used in a project.

The specification intentionally does not require the new implementation to reuse the predecessor's Vuex state shape, YAML parsing, Fuse.js search behavior, Bootstrap styling, or Nuxt 2 implementation. Those are historical references, not dependencies.

## AI answering behavior

AI answers MUST be grounded in the governed resume data available to the application. The answerer MUST expose enough source attribution in the UI or answer metadata for a visitor to understand which resume facts support the response.

The AI mode MUST distinguish the four response statuses defined by the AI chat contract in `contracts.md`:

- `answered`. The app returns a concise answer grounded in governed resume data.
- `partial`. The app states the supported portion and identifies what is not covered by governed data.
- `unanswerable`. The app refuses to fabricate and explains that the governed resume data does not contain the requested fact.
- `declined`. The app declines the request per the decline rules below.

The app MUST decline requests that are off-topic for the resume owner, that request private data beyond governed facts, or that attempt to manipulate the answerer into ignoring its grounding rules. A declined response MUST state its reason category and MUST NOT fabricate resume facts.

The specific model provider, retrieval implementation, prompt format, and storage backend are implementation choices until a future proposed change makes them load-bearing. Any provider-specific configuration MUST stay outside the public client bundle.

## MCP behavior

The MCP server is a planned product surface. When implemented, it MUST expose governed resume data and supported question-answering capabilities through stable tools or resources. It MUST NOT expose secrets, private local files, deployment credentials, or ungoverned memory.

The MCP server MAY share the same data-access and answer-grounding modules as the web app. It MUST NOT require the browser UI to run.

## Definition of Done

A change to the AI-centric interactive resume MUST satisfy this Definition of Done before merge:

- The behavior is covered by this specification or by an accepted proposed change.
- Every scenario in `scenarios.md` affected by the change is mapped to an end-to-end or integration test.
- The implementation quality gates in `non-functional-requirements.md` §"Definition of done for implementation work" pass.
- AI behavior remains grounded in governed resume data.

## Non-goals

The initial product spec does not require a native mobile application, private recruiter portal, analytics dashboard, or general-purpose chatbot unrelated to the resume.
