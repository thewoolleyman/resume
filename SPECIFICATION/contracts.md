# AI-centric interactive resume - contracts

## Web routes

The application MUST expose these browser routes or route-equivalent states:

| Route or state | Purpose |
|---|---|
| `/` | Default interactive resume mode. |
| `/static` | Traditional static resume rendering with all governed resume data. |
| `/ai` | AI-driven question-answering mode. |

If the implementation uses query parameters, hash routes, or framework-specific route groups instead of these exact paths, it MUST provide stable deep links with equivalent semantics and MUST redirect or link from the route names above.

## Resume data contract

The canonical resume data consumed by the app MUST be representable as a structured document with this conceptual shape:

| Field | Meaning |
|---|---|
| `profile` | Header, summary, contact, and public profile data. |
| `sections` | Ordered resume sections. |
| `items` | Stable-ID resume items referenced by sections. |
| `skills` | Stable-ID skills, categories, and optional proficiency metadata. |
| `relationships` | Optional links between items, skills, roles, projects, or evidence. |
| `metadata` | Data version, generated timestamp when applicable, and provenance notes. |

Every first-class item MUST include `id`, `title`, and enough display content for static rendering. Optional fields MUST have explicit default behavior in the consuming code. Missing optional collections MUST behave as empty collections.

## Static rendering contract

Static resume mode MUST render all governed resume data without requiring a visitor to use search, filters, chat, hover state, or progressive disclosure. Browser print and PDF capture MUST preserve readable section order and visible URLs for public links.

## Interactive rendering contract

Interactive mode MUST support stable section navigation and stable anchors for first-class resume items. A URL containing an item or section anchor MUST scroll to or otherwise reveal that target after data loading completes.

Interactive search or filtering MUST operate only over governed resume data. An empty search query MUST restore the default ordered view. A query with no matches MUST show a no-results state without losing the user's current mode.

## AI chat contract

The AI mode MUST accept a visitor question as text and return one of these response records:

| Field | Required | Meaning |
|---|---|---|
| `status` | yes | `answered`, `partial`, `unanswerable`, or `declined`. |
| `answer` | yes | Visitor-facing response text. |
| `citations` | yes | Zero or more references to governed resume data items or sections. |
| `followups` | no | Suggested grounded follow-up questions. |
| `diagnostic` | no | Non-secret diagnostic category for debugging or analytics. |

`answered` and `partial` responses MUST include at least one citation unless the answer is about the app itself rather than the resume owner. `unanswerable` and `declined` responses MAY have an empty citation list.

## Future MCP contract

When MCP support is implemented, the server MUST expose a documented tool or resource for retrieving structured resume data. If question answering is exposed through MCP, its result shape MUST preserve the same outcome categories as the AI chat contract.

MCP clients MUST receive data from the same governed source as the web app. The MCP surface MUST NOT read arbitrary files from the repository or host.

## Environment contract

The production URL is `https://resume.thewoolleyweb.com`. The deployment target is Vercel. The app MUST support three environment classes:

| Environment | Purpose |
|---|---|
| Development | Local developer server and local checks. |
| Preview | Vercel preview deployments for branches or pull requests. |
| Production | Public resume site at `resume.thewoolleyweb.com`. |

Secrets required for AI providers, deployment, analytics, or MCP hosting MUST be supplied through environment variables or managed platform secrets. They MUST NOT be committed to the repository or embedded in static client assets.

## CLI and package scripts

The repository MUST provide an aggregate check command that runs the full local quality gate. The exact command is selected by implementation tooling, but for a TypeScript/Bun project it SHOULD be `bun run check` or a `just check` wrapper that delegates to Bun scripts.

The repository SHOULD provide these command categories:

| Command category | Required behavior |
|---|---|
| Bootstrap | Install pinned dependencies and local hooks. |
| Dev server | Run the app locally. |
| Build | Produce the Vercel-deployable production build. |
| Typecheck | Run TypeScript checks. |
| Lint and format | Check style and formatting, with separate mutating fix commands. |
| Unit tests | Run fast unit tests. |
| End-to-end tests | Run Playwright scenarios against the app. |
| Aggregate check | Run all required non-mutating checks. |

## Exit-code table

Repository-owned CLIs and scripts that expose explicit process status MUST use this baseline unless a narrower tool's convention is documented:

| Code | Meaning |
|---|---|
| `0` | success |
| `1` | internal bug or unexpected tool failure |
| `2` | usage error or invalid command invocation |
| `3` | precondition failure such as missing environment, missing dependency, or invalid project state |

## Error payloads

User-facing errors MUST be written for visitors and MUST NOT expose stack traces, prompts, secrets, raw provider responses, or filesystem paths. Developer-facing diagnostics MAY include structured categories and trace identifiers when they do not reveal secrets.
