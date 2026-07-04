# AI-centric interactive resume

## Product intent

The application MUST be a modern TypeScript implementation of Chad Woolley's interactive resume. It MUST preserve the core concept of the predecessor `../interactive-resume.gitlab.io`: a single-page interactive resume that presents structured resume data through browsable sections, searchable or filterable item lists, stable anchors, and a polished browser experience.

The application MUST add two surfaces beyond the predecessor:

- A traditional static-resume rendering mode that exposes the complete resume data in a printable and crawlable form.
- An AI-driven mode that presents a chat box where visitors can ask questions about Chad Woolley and receive answers grounded in the same resume data and any explicitly governed supporting facts.

The application MUST eventually expose an MCP server so external agents can query the governed resume data and supported question-answering surface without scraping the UI.

## Operating modes

The product has three user-facing modes:

1. Interactive mode. This is the default web experience at `resume.thewoolleyweb.com`. It presents the resume as a single-page application with section navigation, item lists, rich detail views, and responsive layouts.
2. Static resume mode. This mode renders all resume data in a traditional resume format suitable for print, PDF capture, search engines, and readers that do not use client-side interactivity.
3. AI-driven mode. This mode presents a chat interface for asking questions about the resume owner. Answers MUST be grounded in governed resume data. When the app cannot answer from governed data, it MUST say so instead of inventing facts.

## Resume data

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

The AI mode MUST distinguish these outcomes:

- Answerable question. The app returns a concise answer grounded in resume data.
- Partially answerable question. The app states the supported portion and identifies what is not covered by governed data.
- Unanswerable question. The app refuses to fabricate and explains that the resume data does not contain the requested fact.
- Unsafe or irrelevant request. The app declines or redirects according to the app's safety policy.

The specific model provider, retrieval implementation, prompt format, and storage backend are implementation choices until a future proposed change makes them load-bearing. Any provider-specific configuration MUST stay outside the public client bundle.

## MCP behavior

The MCP server is a planned product surface. When implemented, it MUST expose governed resume data and supported question-answering capabilities through stable tools or resources. It MUST NOT expose secrets, private local files, deployment credentials, or ungoverned memory.

The MCP server MAY share the same data-access and answer-grounding modules as the web app. It MUST NOT require the browser UI to run.

## Livespec-first workflow

This repository is both a real resume product and a greenfield livespec dogfooding project. The implementation MUST be built from this specification through the livespec propose-change and revise loop. Initial implementation work MUST treat the specification as authoritative and MUST update it before or with any behavior change.

The project MUST dogfood the Codex driver and the git-jsonl orchestrator. The workflow MAY borrow practices from the wider livespec fleet, but the app MUST remain standalone: runtime behavior, deployment, and local development MUST NOT depend on sibling checkouts of livespec, livespec-dev-tooling, or any other fleet repository.

## Deployment environments

Production MUST be deployed at `https://resume.thewoolleyweb.com` on Vercel. Preview deployments MUST be available for pull requests or branches through Vercel preview environments. Local development MUST support a developer running and testing the application without production credentials.

## Definition of Done

A change to the AI-centric interactive resume MUST satisfy this Definition of Done before merge:

- The behavior is covered by this specification or by an accepted proposed change.
- User-facing behavior has tests at the appropriate level, with every scenario in `scenarios.md` mapped to an end-to-end or integration test before the scenario is considered complete.
- The TypeScript type check, lint, formatter check, unit tests, integration tests, and Playwright end-to-end tests pass through one aggregate check command.
- Vercel production and preview constraints remain satisfied.
- No runtime dependency on sibling livespec fleet repositories is introduced.
- AI behavior remains grounded in governed resume data and does not persist local agent memory.

## Non-goals

The initial product spec does not require a native mobile application, private recruiter portal, analytics dashboard, or general-purpose chatbot unrelated to the resume. The project MUST NOT become a dependency consumer of livespec fleet repositories at runtime merely because it adopts their discipline.
