# AI-centric interactive resume - constraints

## Runtime and language

The implementation MUST be TypeScript. Browser-facing code MUST run on modern evergreen browsers supported by the chosen Vercel-compatible framework. Server-side or edge-side code MUST run in a Vercel-supported JavaScript or TypeScript runtime.

## Framework and deployment

The app MUST be deployable to Vercel and MUST preserve the three environment classes defined in `contracts.md` §"Environment contract". If the implementation chooses Next.js, Vercel framework defaults SHOULD be used unless a requirement makes a custom setup necessary.

Preview URLs MUST be treated as non-production environments and MUST NOT be indexed or presented as canonical resume URLs.

## Standalone boundary

The app MUST remain standalone. It MAY read ideas, patterns, or requirements from sibling livespec fleet repositories during development, but runtime code, build scripts, tests, CI, and deployment MUST NOT require those sibling checkouts to exist.

Any shared discipline imported from livespec-dev-tooling MUST be re-expressed as local TypeScript/Bun/Vercel tooling or documented repository policy. Python-only fleet checks MUST NOT be required to build or run this app. The Result and railway-oriented programming enforcement in `non-functional-requirements.md` §"Result and railway-oriented programming discipline" MUST be realized with local TypeScript/Bun/Vercel-compatible tooling under this boundary and MUST NOT import livespec's Python enforcement suite.

## Predecessor data migration boundary

The governed resume data (defined in `spec.md` §"Resume data") replaces the predecessor's external YAML data source. The new app MUST NOT depend at runtime on the sibling `../interactive-resume.gitlab.io` checkout or on the old GitLab Pages data URL. The implementation work, however, MUST import or transcribe the predecessor's current production resume content into the governed data source so predecessor parity (per `spec.md` §"Predecessor data model parity") is preserved rather than lost.

## Browser metadata parity

The interactive and static surfaces MUST preserve the predecessor's browser metadata where it still applies: the page title `Chad Woolley - Resume`, viewport metadata, favicon and app icons or documented replacements, robots and canonical behavior consistent with the preview-non-index rule above, and no-horizontal-scroll responsive behavior.

## Data authority

The governed resume data (defined in `spec.md` §"Resume data") is the authority for resume facts. UI copy, static rendering, AI answers, tests, and MCP responses MUST derive from that data or from this specification. Duplicated resume facts in components, prompts, tests, or documentation MUST be avoided unless the duplicate is an assertion fixture whose purpose is explicit.

## AI safety and grounding

AI provider calls MUST happen only from server-side, edge-side, or otherwise secret-safe execution contexts. Client bundles MUST NOT contain provider API keys, private prompts, or private evaluation fixtures.

The AI mode MUST ground answers in governed resume data. The implementation MUST include a boundary that prevents ungrounded model output from being presented as resume fact. The exact retrieval or citation mechanism is an implementation choice until specified further.

## MCP safety

The future MCP server MUST expose only governed resume data and documented app capabilities. It MUST NOT expose arbitrary filesystem access, shell execution, deployment secrets, local memories, or agent-private state.

## Accessibility and responsive behavior

The web UI MUST be usable on mobile and desktop viewports. Interactive controls MUST be keyboard-accessible, labeled, and compatible with assistive technology. Static resume mode MUST remain readable when printed or rendered to PDF.

## Performance and availability

The default interactive resume MUST load quickly enough for a public personal site. Static resume content SHOULD be prerendered or otherwise available without waiting on AI provider calls. Failure of AI provider integration MUST NOT prevent interactive or static resume modes from rendering.

## External services

Vercel is the deployment platform. AI provider, analytics, storage, or observability services MAY be added through future proposed changes. Each external service MUST have documented environment variables, failure behavior, and local-development behavior before implementation.
