# AI-centric interactive resume - contracts

Phase-1 contracts are the interactive and static surfaces. The AI chat contract and the Future MCP contract are later-phase and non-load-bearing in phase 1 per `spec.md` §"Delivery phases"; they are marked as such in their sections below.

## Web routes

Phase-1 mode MUST expose these browser routes or route-equivalent states:

| Route or state | Purpose | Phase |
|---|---|---|
| `/` | Default interactive resume mode. | Phase 1 |
| `/static` | Traditional static resume rendering with all governed resume data. | Phase 1 |
| `/ai` | AI-driven question-answering mode. | Later-phase |

The `/ai` route is a later-phase surface. Phase 1 MAY omit `/ai` entirely or serve a documented placeholder that does not answer questions; a phase-1 implementation MUST NOT be judged non-compliant for lacking AI behavior at `/ai`.

If the implementation uses query parameters, hash routes, or framework-specific route groups instead of these exact paths, it MUST provide stable deep links with equivalent semantics and MUST redirect or link from the route names above.

## Governed data source contract

The governed resume data (defined in `spec.md` §"Resume data") MUST load from exactly one canonical, version-controlled source document in this repository, whose documented path is authoritative per `spec.md` §"Governed data source and predecessor import (phase 1)". The source format MUST be a structured, machine-parseable document (for example YAML or JSON) that parses to the shape in §"Resume data contract".

The source MUST carry the imported predecessor production content with the fields enumerated in `spec.md` §"Governed data source and predecessor import (phase 1)". Date scalars MUST use ISO-8601 calendar dates (`YYYY-MM-DD`), optionally with a time component, interpreted in UTC. Markdown is allowed in `about.content` and item descriptions and MUST be rendered and sanitized per §"Item rendering".

Loading MUST reject a malformed governed source — a document missing the required `about` or `header` group, or a section item lacking a display name — with the visitor-safe error state defined in §"Interactive rendering contract", not a partial or guessed render.

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

Every section's display name MUST be the corresponding governed data group's name. Section order MUST follow governed data order. The legacy `#list-<ordinal>` section anchor's ordinal MUST be the section's one-based position in governed data order.

Every first-class item MUST include `id`, a display `title` (the predecessor's `name` field is this same display label), and enough display content for static rendering. An item MAY additionally carry an optional skill `level`, an optional `start` value, an optional `end` value, and a markdown description (`desc`). Items MUST render in governed data order by default. Optional fields MUST have explicit default behavior in the consuming code. Missing optional collections MUST behave as empty collections.

Each item's `id` MUST be derived deterministically from its section display name and item display name per `spec.md` §"Stable item identifiers", including that section's slug-collision disambiguation rule. Item `id`s MUST be stable across reordering and MUST serve as public, deep-linkable item anchors.

## Static rendering contract

Static resume mode MUST render all governed resume data without requiring a visitor to use search, filters, chat, hover state, or progressive disclosure. Browser print and PDF capture MUST preserve readable section order and visible URLs for public links.

Static resume mode MUST render the same governed profile, about, header, section, and item data as interactive mode, in the same canonical order, fully expanded, without requiring search, skill filters, collapse state, hover, chat, or JavaScript-only disclosure. Static mode MUST preserve markdown text, public links, visible URLs for printing/PDF, date formatting (per §"Item rendering"), item levels, and section names. Static mode MAY omit interactive controls, but it MUST NOT omit any resume fact that interactive mode renders.

## Interactive rendering contract

Interactive mode MUST support stable section navigation and stable anchors for first-class resume items.

### Data-load lifecycle

Interactive mode MUST follow this observable data-load state machine:

1. **Shell render.** The sticky navigation bar and the centered header MUST render immediately, before and during governed data loading. The application shell MUST NOT be hidden behind a blank page while data loads.
2. **Loading.** While governed resume data is loading, interactive mode MUST show a loading indicator in the content area beneath the shell.
3. **Success render.** When loading, parsing, and transforming the governed data all succeed, interactive mode MUST replace the loading indicator with the rendered resume sections and items.
4. **Failure render.** If any of fetching the governed source, parsing it, or transforming it into the resume data contract fails, interactive mode MUST render an explicit visitor-facing error state while keeping the shell visible, and MUST NOT show a blank page or leak a raw diagnostic (per §"Error payloads"). The covered failure classes MUST include fetch failure, malformed governed data (missing required groups or a nameless item), parse failure, and transform failure.
5. **Hash reveal.** A URL containing an item or section anchor MUST reveal that target only after the success render completes. Hash navigation MUST wait until data loading and rendering complete and MUST then reveal the target without leaving it hidden underneath the sticky navigation bar. A hash that targets no existing anchor MUST be a no-op that leaves the default view intact. Reset MUST clear the hash/deep-link state per §"Collapse and reset".

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

The layout above is a requirement, not merely a sketch. Specifically:

- **Sticky, responsive navigation bar.** The navigation bar MUST be sticky and dark-themed. On narrow viewports it MUST collapse its controls behind a toggle rather than overflowing or forcing horizontal scroll; on wide viewports the controls MUST be laid out inline.
- **Control order.** The navigation bar MUST include, in this order, live search, Contents, Skill Levels, and Reset, with Instructions and About right-aligned at the trailing edge of the bar.
- **Contents.** Contents MUST list all resume sections in governed data order and link to stable section anchors. The implementation MUST preserve the legacy `#list-<ordinal>` section anchors as aliases, or define deterministic redirects from those hashes to the new stable section identifiers, where `<ordinal>` is the section's one-based position in governed data order.
- **Centered header.** The header MUST be centered and dark-themed and MUST render `header.name` as the primary line and `header.contact` as the secondary line.
- **Section header.** Each section MUST render a section-header bar carrying, from left to right, a collapse/expand toggle whose control visibly reflects the expanded-versus-collapsed state, the section display name, and a right-aligned per-section sort control labeled `sort`.
- **Item row.** Each item MUST render as a row with three column roles: the item name plus its optional level indicator, a date column, and the markdown-rendered description, per §"Item rendering".
- **Sticky-nav offset anchor.** Each section MUST expose a navigation offset anchor positioned so that revealing a section via its hash does not leave the section heading hidden underneath the sticky navigation bar.

### About and Instructions controls

The About control MUST open an About surface whose title is bound to governed `about.title` and whose body renders the markdown `about.content`, using the same markdown rendering and sanitization as item descriptions (per §"Item rendering"). About MUST NOT display hard-coded resume prose that bypasses governed data.

The Instructions control MUST open an Instructions surface that explains how to use the interactive resume. Its content MUST cover these functional topics; the exact copy MAY be refined, but every topic MUST be present:

- Live search filters all resume text.
- Contents scrolls to or reveals a selected section.
- Skill Levels checkboxes filter items by skill level, with an explanation of what each level means.
- Each section can be collapsed and expanded with the section header's arrow control.
- Each section defaults to its original order and can be sorted independently by name, start date, or end date.
- Reset restores search, skill filters, per-section sort, and collapse state to their defaults.

### Search

Interactive search MUST operate only over governed resume data. Search MUST be live and MUST operate over governed item display names plus the plain-text form of markdown descriptions. It MUST be case-insensitive and MUST match partial tokens or substrings within governed item names and markdown-stripped descriptions. The exact matching algorithm, such as fuzzy matching, substring matching, or token matching, is an implementation choice as long as those observable semantics hold. Search MUST NOT match markdown syntax or HTML tags as searchable content.

Matched results MUST be presented in canonical item order (governed data order), not in relevance-ranked order. Within each section, only that section's own matched items MUST be shown, preserving the section's canonical ordering before any per-section sort is applied.

Search MUST compose with the other interactive controls deterministically in this order: first restrict each section to its items matching the current query, then apply skill-level filtering (per §"Skill-level filtering"), then apply that section's sort (per §"Per-section sorting"). An empty search query MUST restore the default ordered section/item view.

A query with no matches MUST keep the visitor in interactive mode, preserve every section header and the overall section structure, leave the matched item rows empty, and show an explicit no-results state. This explicit no-results state is an intentional enhancement over the predecessor, which left matched sections silently empty without a message.

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

The Skill Levels control MUST default to all levels selected, MUST allow toggling each level independently, and MUST explain the levels in the UI.

Items with no level MUST behave as `unspecified` for filtering purposes and MUST NOT render a level badge. Items whose level is one of the defined keys MUST be shown only when that level is selected.

Items with an invalid legacy level — a level value that is not one of the defined keys — MUST remain visible regardless of which skill levels are selected, MUST render a level indicator showing the original invalid key, and MUST expose an `unknown level` explanation (per §"Item rendering") rather than silently disappearing. This resolves the earlier ambiguity between visibility guidance elsewhere in this contract: invalid-level items are always kept visible and diagnosed, never filtered out.

### Per-section sorting

Each section MUST support independent sort state. The available sort options MUST be exactly these seven, in this order, with these visitor-facing labels; internal identifiers are an implementation choice:

| Label | Semantics |
|---|---|
| Default | Preserves canonical governed data order. |
| Name Asc | Item display names ascending. |
| Name Desc | Item display names descending. |
| Start Date Asc | Parsed start dates ascending. |
| Start Date Desc | Parsed start dates descending. |
| End Date Asc | Parsed end dates ascending. |
| End Date Desc | Parsed end dates descending. |

Sort semantics MUST match the predecessor:

- Name sorts MUST compare item display names by locale-aware string comparison.
- Date sorts MUST use the parsed start/end dates. A missing start MUST order as the earliest possible instant (so missing-start items sort first under Start Date Asc and last under Start Date Desc). A missing end MUST be treated as current — ordered as a far-future instant — so missing-end items sort last under End Date Asc and first under End Date Desc.
- Every sort MUST break ties on the item display name: ascending sorts break ties ascending by name, and descending sorts break ties descending by name.
- Default MUST restore canonical governed data order.

Invalid sort input MUST fall back to default order or be rejected before it mutates sort state, without corrupting the rendered order.

### Collapse and reset

Each section MUST be collapsible and expandable. Collapsed sections hide their rows but keep the section header and anchor available. Reset MUST clear search text, select all skill levels, restore every section's default sort, expand collapsed sections, scroll to the top, and clear the hash/deep-link state.

### Item rendering

Item rendering MUST preserve the predecessor semantics: item name, an optional level badge/label, a date column, and a markdown-rendered description, laid out as the three item-row columns in §"Layout and controls".

The level indicator MUST display the level key and make the human-readable level explanation available on interaction such as hover or focus. An item with no level MUST render no level indicator (per §"Skill-level filtering"). An invalid legacy level MUST keep the item visible and MUST expose a diagnostic label such as `unknown level` instead of silently dropping the item.

Dates MUST render month/year as `M.YYYY` (a one- or two-digit month number with no zero-padding and a four-digit year). A missing start with a present end MUST render `until` in the start position. A present start with a missing end MUST render `current` in the end position. A missing start and end MUST render the item as current. Markdown in `about.content` and item `desc` MUST render consistently in interactive and static modes, with sanitization rules documented before any untrusted content is admitted.

## AI chat contract

This is a later-phase contract and is non-load-bearing in phase 1 per `spec.md` §"Delivery phases". It becomes load-bearing only when a future proposed change activates AI-driven mode.

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

This is a later-phase contract and is non-load-bearing in phase 1 per `spec.md` §"Delivery phases".

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
