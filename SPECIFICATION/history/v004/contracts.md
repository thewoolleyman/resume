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

The governed resume data (defined in `spec.md` §"Resume data") MUST be representable as a structured document with this conceptual shape:

| Field | Meaning |
|---|---|
| `profile` | Header and about/summary data: `about.title`, markdown `about.content`, `header.name`, and `header.contact`. |
| `sections` | Ordered, arbitrarily named resume sections in canonical data order. |
| `items` | Stable-ID resume items referenced by sections. |
| `skills` | Stable-ID skills, categories, and optional proficiency metadata. |
| `relationships` | Optional links between items, skills, roles, projects, or evidence. |
| `metadata` | Data version, generated timestamp when applicable, and provenance notes. |

Every first-class item MUST include `id`, a display `title` (the predecessor's `name` field is this same display label), and enough display content for static rendering. An item MAY additionally carry an optional skill `level`, an optional `start` value, an optional `end` value, and a markdown description (`desc`). Optional fields MUST have explicit default behavior in the consuming code. Missing optional collections MUST behave as empty collections.

## Static rendering contract

Static resume mode MUST render all governed resume data without requiring a visitor to use search, filters, chat, hover state, or progressive disclosure. Browser print and PDF capture MUST preserve readable section order and visible URLs for public links.

Static resume mode MUST render the same governed profile, about, header, section, and item data as interactive mode, in the same canonical order, fully expanded, without requiring search, skill filters, collapse state, hover, chat, or JavaScript-only disclosure. Static mode MUST preserve markdown text, public links, visible URLs for printing/PDF, date formatting (per §"Interactive rendering contract" → item rendering), item levels, and section names. Static mode MAY omit interactive controls, but it MUST NOT omit any resume fact that interactive mode renders.

## Interactive rendering contract

Interactive mode MUST support stable section navigation and stable anchors for first-class resume items. A URL containing an item or section anchor MUST scroll to or otherwise reveal that target after data loading completes. Hash navigation MUST wait until data loading and rendering complete and MUST then reveal the target without leaving it hidden underneath the sticky navigation bar.

### Layout and controls

Interactive mode MUST render a sticky navigation bar plus a centered header and ordered resume sections, equivalent to:

```text
+--------------------------------------------------------------+
| sticky nav: [search] [Contents] [Skill Levels] [Reset] ...   |
|                                          [Instructions][About]|
+--------------------------------------------------------------+
| centered header: name                                        |
| centered header: contact                                     |
+--------------------------------------------------------------+
| section header: [collapse arrow] Section Name       sort: [] |
| row: item name + level | dates | markdown description        |
| row: ...                                                     |
+--------------------------------------------------------------+
| next section ...                                             |
+--------------------------------------------------------------+
```

The navigation bar MUST include live search, Contents, Skill Levels, Reset, Instructions, and About controls. Contents MUST list all resume sections in data order and link to stable section anchors. The implementation MUST preserve the legacy `#list-<ordinal>` section anchors as aliases, or define deterministic redirects from those hashes to the new stable section identifiers.

### Search

Interactive search MUST operate only over governed resume data. Search MUST be live and MUST operate over governed item names plus the plain-text form of markdown descriptions. It MUST NOT match markdown syntax or HTML tags as searchable content. An empty search query MUST restore the default ordered section/item view. A query with no matches MUST keep the visitor in interactive mode and show an explicit empty state for the affected content without losing the user's current mode.

### Skill-level filtering

Skill filtering MUST preserve the predecessor skill levels and their visitor-facing explanations:

| Level | Meaning |
|---|---|
| `played` | I have played around with it for fun |
| `once` | I have used it on a single job or project |
| `often` | I have used it on multiple jobs or projects |
| `toolbox` | It's part of my toolbox; I use it daily |
| `teach` | I know it in depth, I could teach a workshop or class on it |
| `unspecified` | Unspecified |

The Skill Levels control MUST default to all levels selected, MUST allow toggling each level independently, and MUST explain the levels in the UI. Items with no level MUST behave as `unspecified`. Items with an invalid legacy level SHOULD remain visible and SHOULD expose an implementation-visible diagnostic rather than silently disappearing.

### Per-section sorting

Each section MUST support independent sort state with at least these options: Default, Name Asc, Name Desc, Start Date Asc, Start Date Desc, End Date Asc, End Date Desc. Default preserves canonical data order. Name sorts compare item names. Date sorts use parsed start/end dates, use item-name tie-breakers, and treat missing end dates as current for end-date ordering. Invalid sort input MUST fall back to default order or be rejected before it mutates state.

### Collapse and reset

Each section MUST be collapsible and expandable. Collapsed sections hide their rows but keep the section header and anchor available. Reset MUST clear search text, select all skill levels, restore every section's default sort, expand collapsed sections, scroll to the top, and clear the hash/deep-link state.

### Item rendering

Item rendering MUST preserve the predecessor semantics: item name, an optional level badge/label carrying the level explanation, a date column, and a markdown-rendered description. Dates MUST render month/year as `M.YYYY`. A missing start with a present end MUST render `until`. A present start with a missing end MUST render `current`. A missing start and end MUST render the item as current. Markdown in `about.content` and item `desc` MUST render consistently in interactive and static modes, with sanitization rules documented before any untrusted content is admitted.

## AI chat contract

The AI mode MUST accept a visitor question as text and return one of these response records:

| Field | Required | Meaning |
|---|---|---|
| `status` | yes | `answered`, `partial`, `unanswerable`, or `declined`. |
| `answer` | yes | Visitor-facing response text. |
| `citations` | yes | Zero or more references to governed resume data items or sections. |
| `followups` | no | Suggested grounded follow-up questions. |
| `diagnostic` | no | Non-secret diagnostic category for debugging or analytics. |

`answered` and `partial` responses MUST include at least one citation unless the response asserts no resume-data fact (for example, an answer about the app's own capabilities); that is the only condition under which `answered` or `partial` MAY carry an empty citation list. `unanswerable` and `declined` responses MAY have an empty citation list. `declined` responses MUST follow the decline rules in `spec.md` §"AI answering behavior".

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

## Error payloads

User-facing errors MUST be written for visitors and MUST NOT expose stack traces, prompts, secrets, raw provider responses, or filesystem paths. User-facing error text MUST be derived from the internal error's stable category (the `DomainError.kind` discipline defined in `non-functional-requirements.md` §"Result and railway-oriented programming discipline") through a presentation mapper that strips secrets, prompts, stack traces, filesystem paths, and raw provider payloads. Developer-facing diagnostics MAY include structured categories and trace identifiers when they do not reveal secrets.
