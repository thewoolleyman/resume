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

The governed resume data (defined in `spec.md` §"Resume data") MUST load from exactly one canonical, version-controlled source document in this repository: `data/resume.yml`, the authoritative path named in `spec.md` §"Governed data source and predecessor import (phase 1)". The source format MUST be YAML.

The on-disk source is authored in the predecessor's authoring shape (top-level `about`/`header` plus ordered section keys mapping to item arrays `{name, level?, start?, end?, desc}`, per `spec.md` §"Governed data source and predecessor import (phase 1)"), NOT in the derived shape of §"Resume data contract". Loading MUST apply a single, documented, deterministic transform from that authoring shape into the §"Resume data contract" shape: each top-level key other than `about`/`header` becomes a section whose display name is that key verbatim; each item `name` becomes the contract item `title`; item `level`/`start`/`end`/`desc` map through unchanged; and stable item and section identifiers are derived per `spec.md` §"Stable item identifiers" and `spec.md` §"Stable section identifiers". The transform MUST be pure and side-effect-free so the same source always yields the same contract data.

The `data/resume.yml` source MUST carry the imported predecessor production content with the fields, pinned inventory, and provenance enumerated in `spec.md` §"Governed data source and predecessor import (phase 1)". Date scalars MUST use ISO-8601 calendar dates (`YYYY-MM-DD`), optionally with a time component, interpreted in UTC. Markdown is allowed in `about.content` and item descriptions and MUST be rendered per §"Item rendering", preserving owner-authored HTML under the phase-1 trusted-source posture stated there.

Loading MUST reject a malformed governed source — a document missing the required `about` or `header` group, or a section item lacking a display name — rather than producing a partial or guessed render. Under the phase-1 build-time load (per §"Interactive rendering contract"), rejection MUST fail the build/prerender so malformed data never reaches production; under any runtime load path, rejection MUST surface the visitor-safe error state defined in §"Interactive rendering contract".

## Resume data contract

The governed resume data (defined in `spec.md` §"Resume data") MUST be representable as a structured document with this conceptual shape:

| Field | Meaning | Phase 1 |
|---|---|---|
| `profile` | Header and about/summary data: `about.title`, markdown `about.content`, `header.name`, and `header.contact`. | Load-bearing |
| `sections` | Ordered, arbitrarily named resume sections in canonical data order, each with a stable section identifier. | Load-bearing |
| `items` | Stable-ID resume items referenced by sections. | Load-bearing |
| `skills` | Optional skills taxonomy (categories and proficiency metadata) distinct from ordinary sections. | Deferred — empty |
| `relationships` | Optional cross-links between items, skills, roles, projects, or evidence. | Deferred — empty |
| `metadata` | Data version, generated timestamp when applicable, and provenance notes. | Optional (provenance only) |

In phase 1, `profile`, `sections`, and `items` are load-bearing and MUST be populated from the governed source. Skill proficiency in phase 1 is the ordinary per-item `level` field, NOT the `skills` taxonomy: the `skills` collection (as a taxonomy separate from ordinary sections), the `relationships` collection, and any `metadata` beyond simple provenance are OPTIONAL, forward-looking, and MUST default to empty in phase 1 per `spec.md` §"Resume data". A phase-1 implementation MUST NOT be judged non-compliant for leaving them empty and MUST NOT invent taxonomy or relationship data that has no governed source.

Every section's display name MUST be the corresponding governed data group's name, and every section MUST carry a stable section identifier derived per `spec.md` §"Stable section identifiers". Section order MUST follow governed data order. The section's stable identifier (its slug) is the canonical section anchor; the legacy `#list-<ordinal>` section anchor, whose ordinal MUST be the section's one-based position in governed data order, MUST resolve to that stable identifier as an alias or a deterministic redirect.

Every first-class item MUST include `id`, a display `title` (the predecessor's `name` field is this same display label), and enough display content for static rendering. An item MAY additionally carry an optional skill `level`, an optional `start` value, an optional `end` value, and a markdown description (`desc`). Items MUST render in governed data order by default. Optional fields MUST have explicit default behavior in the consuming code. Missing optional collections MUST behave as empty collections.

Each item's `id` MUST be the public item anchor composed deterministically per `spec.md` §"Stable item identifiers": the base section slug, a single hyphen, and the item title slug (`<section-slug>-<title-slug>`), with item-level `-2`/`-3` collision suffixes appended to the composed identifier in governed data order and section-level collision suffixes NOT participating. Item `id`s MUST be stable across reordering and MUST serve as public, deep-linkable item anchors; for example the `Senior Software Engineer, Pivotal` item in `Job History` has `id` and anchor `job-history-senior-software-engineer-pivotal`.

## Static rendering contract

Static resume mode MUST render all governed resume data without requiring a visitor to use search, filters, chat, hover state, or progressive disclosure. Browser print and PDF capture MUST preserve readable section order and visible URLs for public links.

Static resume mode MUST render the same governed profile, about, header, section, and item data as interactive mode, in the same canonical order, fully expanded, without requiring search, skill filters, collapse state, hover, chat, or JavaScript-only disclosure. Static mode MUST preserve markdown text, public links, visible URLs for printing/PDF, date formatting (per §"Item rendering"), item levels, and section names. Static mode MAY omit interactive controls, but it MUST NOT omit any resume fact that interactive mode renders.

## Interactive rendering contract

Interactive mode MUST support stable section navigation and stable anchors for first-class resume items.

### Data-load lifecycle

In phase 1 the governed data is read at build/prerender time and baked into the prerendered response (per `constraints.md` §"Framework and deployment" and `constraints.md` §"Performance and availability"). The interactive route therefore performs NO runtime fetch of the governed source in normal operation, and the success state is the prerendered state. A runtime-fetch/hydration mode MAY exist, but it is not required for phase 1, and the loading-indicator and fetch-failure states below are observable ONLY in that runtime mode.

Interactive mode MUST follow this observable data-load state machine:

1. **Shell render.** The sticky navigation bar and the centered header MUST render immediately as part of the prerendered response. The application shell MUST NOT be hidden behind a blank page.
2. **Loading (runtime mode only).** When, and only when, a runtime-fetch/hydration mode is used, interactive mode MUST show a loading indicator in the content area beneath the shell while governed resume data is loading. Under the phase-1 build-time load there is no runtime fetch, so this state is unreachable and is non-load-bearing in phase 1.
3. **Success render.** Interactive mode MUST present the rendered resume sections and items. Under the build-time load this is the prerendered content itself; under a runtime mode it MUST replace the loading indicator once loading, parsing, and transforming all succeed.
4. **Failure render.** The governed source can fail to parse, fail to transform into the resume data contract, or be malformed (missing a required group or containing a nameless item); a runtime mode can additionally fail to fetch. These failure classes MUST NOT produce a blank page or leak a raw diagnostic (per §"Error payloads"). Which failure is observable where MUST be honored: under the phase-1 build-time load, parse, transform, and malformed-data failures MUST fail the build/prerender so bad data never ships (there is no runtime fetch to fail); under a runtime-fetch/hydration mode, all of fetch, parse, transform, and malformed-data failures MUST render an explicit visitor-facing error state while keeping the shell visible.
5. **Hash reveal.** A URL containing an item or section anchor MUST reveal that target only after the resume content is present. Hash navigation MUST reveal the target without leaving it hidden underneath the sticky navigation bar. A hash that targets no existing anchor MUST be a no-op that leaves the default view intact. Reset MUST clear the hash/deep-link state per §"Collapse and reset".

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
- **Contents.** Contents MUST list all resume sections in governed data order and link to each section's stable section identifier (its slug, derived per `spec.md` §"Stable section identifiers"). The implementation MUST preserve the legacy `#list-<ordinal>` section anchors as aliases, or define deterministic redirects from those hashes to the stable section identifiers, where `<ordinal>` is the section's one-based position in governed data order.
- **Centered header.** The header MUST be centered and dark-themed and MUST render `header.name` as the primary line and `header.contact` as the secondary line.
- **Section header.** Each section MUST render a section-header bar carrying, from left to right, a collapse/expand toggle whose control visibly reflects the expanded-versus-collapsed state, the section display name, and a right-aligned per-section sort control labeled `sort`.
- **Item row.** Each item MUST render as a row with three column roles: the item name plus its optional level indicator, a date column, and the markdown-rendered description, per §"Item rendering".
- **Sticky-nav offset anchor.** Each section MUST expose a navigation offset anchor whose element id is the section's stable identifier (per `spec.md` §"Stable section identifiers"), positioned so that revealing a section via its hash does not leave the section heading hidden underneath the sticky navigation bar.

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

As a testable floor on those observable semantics, a case-insensitive substring that is present in an item's display name or in its markdown-stripped description MUST cause that item to match, regardless of which matching algorithm is chosen. The plain-text projection of a markdown description used for matching MUST be produced WITHOUT a browser-DOM dependency (no reliance on `document` or `window`), because governed data is projected during server-side and build-time rendering where no DOM exists.

To pin behavior against real data, the specification MUST carry at least one deterministic worked example tied to the committed governed dataset (per `spec.md` §"Governed data source and predecessor import (phase 1)"): a specific query string mapped to the exact set and canonical order of items it MUST match and MUST NOT match, including one word that appears only inside markdown or HTML syntax (which MUST NOT match) and one plain-text prose word (which MUST match). The worked example is authored alongside the committed dataset and is the concrete anchor the search scenarios in `scenarios.md` map to.

For the pinned production dataset in `data/resume.yml`, the worked search example is:

- Query `validated` MUST match exactly one item in canonical order: `Growth / Lean` in the `Skills/Tools - Methodologies/Processes` section. It MUST NOT match `Favorite Nonfiction Books / Articles` or any other item.
- The syntax-only term `theleanstartup`, which appears only inside the markdown link URL `[Lean Startup](http://theleanstartup.com/principles)` in the `Growth / Lean` description, MUST match zero items.
- The plain-text prose term `validated`, which appears in the markdown-stripped `Growth / Lean` description, MUST match that item.

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

Dates render in a two-part date column with an independent **start position** and **end position**, exactly as the predecessor renders them. Month/year values MUST render as `M.YYYY` (a one- or two-digit month number with no zero-padding and a four-digit year). A present date in the **start position** MUST render as its `M.YYYY` value followed immediately by the predecessor's start/end separator — a non-breaking space and a hyphen (`&nbsp;-`) — so the date column matches the predecessor exactly (for example `7.2001&nbsp;-`). A present date in the **end position** MUST render as its bare `M.YYYY` value, with NO separator and no suffix (for example `8.2001`); the end position never carries the `&nbsp;-` separator.

The start and end positions MUST cover all four presence combinations exactly as follows:

| Start value | End value | Start position renders | End position renders |
|---|---|---|---|
| present | present | `M.YYYY` + `&nbsp;-` (e.g. `4.2006&nbsp;-`) | bare `M.YYYY` (e.g. `10.2019`) |
| present | missing | `M.YYYY` + `&nbsp;-` (e.g. `7.2001&nbsp;-`) | `current` |
| missing | present | `until` | bare `M.YYYY` (e.g. `8.2001`) |
| missing | missing | nothing (empty) | `current` |

The present-start/present-end row is the common completed-role shape: its end value MUST render as its own bare `M.YYYY`, so, for example, the `Senior Software Engineer, Pivotal` item (start `2006-04-15`, end `2019-10-29`) renders `4.2006&nbsp;-` in the start position and `10.2019` in the end position. The both-missing row overrides the missing-start row: when BOTH start and end are absent, the start position renders nothing (it is NOT `until`) and the end position renders `current`.

**Markdown rendering and sanitization.** Markdown in `about.content` and item `desc` MUST render consistently across interactive and static modes: both modes MUST use the same markdown renderer and configuration so the rendered output is byte-identical between modes. The renderer MUST support at least the markdown features the production content uses — headings, unordered lists, paragraphs, emphasis and strong, and inline links. Because every phase-1 governed source is owner-authored and therefore trusted, raw HTML embedded in governed markdown MUST be preserved and rendered (matching predecessor output) rather than stripped; the requirement to sanitize "before any untrusted content is admitted" is a forward guard for a future phase that admits non-owner content and is NOT triggered in phase 1. Should a later phase admit untrusted content, a documented sanitization allowlist MUST be applied before that content is rendered.

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
