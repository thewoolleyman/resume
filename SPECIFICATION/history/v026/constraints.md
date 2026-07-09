# AI-centric interactive resume - constraints

## Runtime and language

The implementation MUST be TypeScript. Browser-facing code MUST run on the modern evergreen browsers supported by Svelte and SvelteKit. Server-side or edge-side code MUST run in a Vercel-supported JavaScript or TypeScript runtime.

## Framework and deployment

The app MUST be deployable to Vercel and MUST preserve the three environment classes defined in `contracts.md` §"Environment contract". The app MUST be built with Svelte, using SvelteKit as the application framework for routing, server/edge rendering, and static prerendering, and MUST deploy to Vercel via the SvelteKit Vercel adapter. SvelteKit and Vercel framework defaults SHOULD be used unless a requirement makes a custom setup necessary. This framework declaration is functional and authoritative here in `constraints.md`; `non-functional-requirements.md` §"Contributor toolchain" MAY reference Svelte's Vitest and Playwright integration but MUST NOT restate the framework choice as an independent declaration.

Preview URLs MUST be treated as non-production environments and MUST NOT be indexed or presented as canonical resume URLs.

Deployability alone is not sufficient for MVP completion. Per `spec.md` §"Delivery phases", the MVP MUST be deployed live and reachable across all three environment classes in `contracts.md` §"Environment contract" — Development, Preview, and Production at `https://resume.thewoolleyweb.com` — and reviewed on the running site, not merely produce a passing local adapter build.

## Standalone boundary

The app MUST remain standalone. It MAY read ideas, patterns, or requirements from sibling livespec fleet repositories during development, but runtime code, build scripts, tests, CI, and deployment MUST NOT require those sibling checkouts to exist.

Any shared discipline imported from livespec-dev-tooling MUST be re-expressed as local TypeScript/Bun/Vercel tooling or documented repository policy. Python-only fleet checks MUST NOT be required to build or run this app. Local realization of the Result/ROP enforcement gates under this boundary is specified in `non-functional-requirements.md` §"Result and railway-oriented programming discipline".

## Predecessor data migration boundary

The governed resume data (defined in `spec.md` §"Resume data") replaces the predecessor's external YAML data source. The new app MUST NOT depend at runtime on the sibling `../interactive-resume.gitlab.io` checkout or on the old GitLab Pages data URL. The implementation work, however, MUST import or transcribe the predecessor's current production resume content into the single canonical governed data source so predecessor parity (per `spec.md` §"Predecessor data model parity" and the field-level import requirements in `spec.md` §"Governed data source and predecessor import (phase 1)") is preserved rather than lost. The material to import is the predecessor's production content, not its development or test fixtures.

So this parity does not depend on a live external fetch, a verbatim snapshot of the predecessor's production content MUST be committed into `data/resume.yml` as the authoritative import material, with its provenance (source URL, retrieval date, upstream `Last-Modified`, and content hash) recorded per `spec.md` §"Governed data source and predecessor import (phase 1)". The committed `data/resume.yml` snapshot, not the live URL, is what the build reads.

## Browser metadata parity

The interactive and static surfaces MUST preserve the predecessor's browser metadata where it still applies: the page title `Chad Woolley - Resume`, a description meta tag, the responsive viewport value `width=device-width, initial-scale=1, shrink-to-fit=no` or a documented equivalent, favicon and app icons or documented replacements, robots and canonical behavior consistent with the preview-non-index rule above, and no-horizontal-scroll responsive behavior.

The phase-1 browser metadata surface MUST serve a documented web-app manifest for predecessor PWA parity. The manifest MUST declare `short_name`, `name`, `start_url`, `display: standalone`, a favicon, and app icons at least equivalent to the predecessor's 192x192 and 512x512 PNG icons. The `short_name` and `name` values MAY be updated for the new app, but the standalone display mode plus the favicon and the 192x192 and 512x512 icons MUST be preserved so the app remains installable as the predecessor was.

## Data authority

The governed resume data (defined in `spec.md` §"Resume data") is the authority for resume facts. UI copy, static rendering, AI answers, tests, and MCP responses MUST derive from that data or from this specification. Duplicated resume facts in components, prompts, tests, or documentation MUST be avoided unless the duplicate is an assertion fixture whose purpose is explicit.

## AI safety and grounding

AI provider calls MUST happen only from server-side, edge-side, or otherwise secret-safe execution contexts. Client bundles MUST NOT contain provider API keys, private prompts, or private evaluation fixtures.

The AI mode MUST ground answers in governed resume data. The implementation MUST include a boundary that prevents ungrounded model output from being presented as resume fact. The exact retrieval or citation mechanism is an implementation choice until specified further.

## MCP safety

The future MCP server MUST expose only governed resume data and documented app capabilities. It MUST NOT expose arbitrary filesystem access, shell execution, deployment secrets, local memories, or agent-private state.

## Accessibility and responsive behavior

The web UI MUST be usable on mobile and desktop viewports. On narrow viewports the sticky navigation controls MUST collapse behind a toggle per `contracts.md` §"Layout and controls" rather than overflowing, and no supported viewport MUST require horizontal scrolling of the page. Interactive controls MUST be keyboard-accessible, labeled, and compatible with assistive technology. Static resume mode MUST remain readable when printed or rendered to PDF.

## Performance and availability

The default interactive resume MUST load quickly enough for a public personal site. In phase 1 the governed resume data MUST be read at build/prerender time and baked into the prerendered interactive and static output (per `contracts.md` §"Interactive rendering contract"), so the resume renders without a runtime fetch of the governed source. Static resume content MUST be prerendered; interactive content SHOULD be prerendered and MUST NOT block its initial render on AI provider calls. Failure of AI provider integration MUST NOT prevent interactive or static resume modes from rendering.

## External services

Vercel is the deployment platform. AI provider, analytics, storage, or observability services MAY be added through future proposed changes. Each external service MUST have documented environment variables, failure behavior, and local-development behavior before implementation.
