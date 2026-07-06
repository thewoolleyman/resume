# AI-centric interactive resume - scenarios

The scenarios in the main body are phase-1 acceptance scenarios. The AI and MCP scenarios under §"Later-phase scenarios (non-load-bearing in phase 1)" are deferred per `spec.md` §"Delivery phases" and MUST NOT be mapped to phase-1 acceptance tests.

## Scenario: Governed data preserves the predecessor data shape

Given the predecessor resume defines an about group, a header, and named sections of items with names, optional levels, optional start/end values, and markdown descriptions

When the predecessor content is imported into the governed structured data source

Then the governed data exposes `about.title`, markdown `about.content`, `header.name`, `header.contact`, and the predecessor's ordered section inventory with each section named from its governed data group and each item carrying a stable identifier and its predecessor fields

## Scenario: Import transcribes the predecessor production content

Given the predecessor production resume content served from the predecessor external YAML data source

When that production content is imported into the single canonical governed data source at the repository's documented source path

Then the governed source preserves `about.title`, markdown `about.content`, `header.name`, `header.contact`, every top-level section name and order, and within each section every item's order, display name, optional level, optional start, optional end, and markdown description, with dates represented as ISO-8601 calendar dates interpreted in UTC

## Scenario: Malformed governed data is rejected at load

Given a governed data source that is missing the required about or header group or contains a section item with no display name

When the app loads that governed data

Then the app rejects the source rather than rendering partial or guessed resume data — failing the build/prerender under the phase-1 build-time load so the malformed data never ships, or rendering the visitor-safe error state with the navigation and header shell still visible under a runtime load path

## Scenario: Import derives stable item anchors deterministically

Given predecessor data whose items have no item identifiers and only generated numeric section anchors

When the content is imported into the governed data source

Then each item receives a stable identifier derived deterministically by slugifying its section display name and item display name with documented collision disambiguation, the item anchors are public and deep-linkable, and the identifiers stay stable when items are reordered

## Scenario: Committed governed source round-trips the pinned production inventory

Given the committed governed data snapshot transcribed from the predecessor production content

When the app loads and transforms that source into the resume data contract

Then the loaded data reproduces the pinned production scope from `spec.md` §"Governed data source and predecessor import (phase 1)" — 18 top-level keys, the sixteen sections in their governed order, and 74 items in total — with every item's display name, optional level, optional start, optional end, and markdown description preserved

## Scenario: Sections derive stable slugs used by Contents and offset anchors

Given governed sections whose display names contain spaces, commas, slashes, and hyphens, including names that share long common prefixes

When the interactive resume renders and builds its Contents list and per-section offset anchors

Then each section has a stable slug derived by lowercasing its display name, collapsing each run of non-alphanumeric characters to a single hyphen, trimming leading and trailing hyphens, and disambiguating collisions with `-2`/`-3` in governed data order, and that slug is the Contents link target and the section offset-anchor element id

## Scenario: Visitor opens the interactive resume

Given the production site has governed resume data

When a visitor opens `https://resume.thewoolleyweb.com/`

Then the visitor sees the interactive resume with profile information, the sticky navigation bar, section navigation, and resume items rendered from the governed data

## Scenario: Interactive mode renders prerendered content without a blank page

Given the governed resume data has been read at build time and baked into the prerendered interactive response

When a visitor opens the interactive resume

Then the sticky navigation bar, the centered header shell, and the resume sections and items are all present in the prerendered response without a blank page, and the runtime-only loading indicator is not required because the phase-1 build-time load performs no runtime fetch

## Scenario: Interactive mode preserves section names and order

Given governed resume data contains multiple top-level section groups

When the interactive resume renders

Then each section displays the governed data group's name, sections appear in governed data order, and each section's items appear in governed data order by default

## Scenario: Navigation shell collapses responsively

Given the interactive resume has rendered

When the viewport is narrowed to a small width and then widened

Then on the narrow viewport the navigation controls collapse behind a toggle without horizontal scroll, and on the wide viewport search, Contents, Skill Levels, and Reset appear inline with Instructions and About right-aligned

## Scenario: Visitor uses the About and Instructions controls

Given the interactive resume has rendered

When the visitor opens the About control and the Instructions control from the sticky navigation bar

Then About shows the governed `about.title` as its title and the markdown-rendered `about.content` as its body, and Instructions explains live search, Contents, Skill Levels with their meanings, section collapse/expand, per-section sorting, and Reset, all without leaving interactive mode

## Scenario: Visitor navigates to a stable resume item

Given a resume item has a stable identifier

When a visitor opens a URL that targets that item

Then the app reveals the matching item after data loading completes

## Scenario: Hash navigation to a missing anchor is a no-op

Given a visitor opens a URL whose hash targets no existing item or section anchor

When data loading and rendering complete

Then the app leaves the default ordered view intact without scrolling, error, or hidden content

## Scenario: Revealed section clears the sticky navigation bar

Given a visitor opens a URL containing a section anchor

When data loading and rendering complete and the app reveals that section

Then the section heading is revealed using the section's navigation offset anchor so it is not left hidden underneath the sticky navigation bar

## Scenario: Visitor follows a legacy section anchor

Given a visitor opens a URL containing a legacy `#list-<ordinal>` section hash

When data loading and rendering complete

Then the app treats `<ordinal>` as the section's one-based position in governed data order and reveals the matching section without leaving it hidden under the sticky navigation bar, resolving the legacy hash through a preserved alias or a deterministic redirect to the stable section identifier

## Scenario: Visitor searches the interactive resume

Given the governed resume data contains an item whose name or plain-text description partially matches a search term with different letter casing

When the visitor searches for that term in interactive mode

Then matching is case-insensitive, a case-insensitive substring present in the item's display name or markdown-stripped description guarantees a match, partial matches are shown in canonical item order, clearing the query restores the default ordered view, and a term with no matches shows an explicit no-results state without leaving interactive mode

## Scenario: Search matches markdown-stripped description text

Given a resume item whose markdown description contains a word only inside markdown or HTML syntax and another word in its plain-text prose

When the visitor searches for each word in interactive mode

Then the plain-text prose word matches the item and the markdown/HTML syntax word does not

## Scenario: Search matches the governed dataset's worked example

Given the committed governed dataset and the deterministic search worked example pinned per `contracts.md` §"Search"

When the visitor enters the worked example's query string in interactive mode

Then exactly the worked example's expected set of items match, in canonical order, the plain-text prose word matches, and the word appearing only inside markdown or HTML syntax does not match

## Scenario: No-match search preserves section structure

Given the interactive resume has rendered section headers and item rows

When the visitor searches for a term that matches no items

Then section headers and section structure remain visible while the affected item rows are empty and an explicit no-results state is shown

## Scenario: Search composes with skill filter and section sort

Given a section whose items include some matching a search term at various skill levels

When the visitor searches for that term, deselects one of the matching items' skill levels, and applies a section sort

Then the section first restricts to the query matches, then hides items at the deselected level, then orders the remaining items by the chosen sort, and the surviving items remain in canonical order before that sort is applied

## Scenario: Visitor filters by skill level

Given resume items carry the predecessor skill levels and some items have no level

When the visitor toggles individual levels in the Skill Levels control

Then the control starts with all levels selected, toggling a level shows or hides only items at that level, items with no level behave as `unspecified` and render no level badge, and the UI explains what each level means

## Scenario: Item with an invalid legacy skill level stays visible

Given a resume item carries a skill level that is not one of the defined levels

When the resume renders and the visitor deselects every defined skill level

Then the item remains visible regardless of the selected filters, the level indicator shows the original invalid key, and interacting with it exposes an `unknown level` explanation rather than silently dropping the item

## Scenario: Visitor sorts a section

Given a section contains items with names and start/end dates

When the visitor selects each available sort option for that section

Then the seven options are Default, Name Asc, Name Desc, Start Date Asc, Start Date Desc, End Date Asc, End Date Desc, Default preserves canonical data order, name sorts order by item name, and date sorts order by parsed start/end dates with item-name tie-breakers

## Scenario: Missing start date sorts as earliest

Given a section contains items where some have a start date and some have no start date

When the visitor sorts the section by Start Date Asc and then by Start Date Desc

Then items with no start date order as the earliest instant, sorting first under Start Date Asc and last under Start Date Desc

## Scenario: Missing end date sorts as current

Given a section contains items where some have an end date and some have no end date

When the visitor sorts the section by End Date Asc and then by End Date Desc

Then items with no end date are treated as current, sorting last under End Date Asc and first under End Date Desc

## Scenario: Equal dates break ties by item name

Given a section contains items that share the same sort date

When the visitor sorts the section by an ascending date sort and then by a descending date sort

Then items with equal dates are ordered by item name, ascending by name under the ascending sort and descending by name under the descending sort

## Scenario: Invalid sort input falls back to default order

Given a section receives an invalid sort selection

When the section attempts to apply that sort

Then the section falls back to canonical default order or rejects the input before it mutates sort state, without corrupting the rendered order

## Scenario: Visitor collapses and expands a section

Given a section is expanded

When the visitor collapses it and then expands it again

Then collapsing hides the section rows while keeping the section header and anchor available, and expanding restores the rows

## Scenario: Visitor resets interactive state

Given the visitor has entered a search term, deselected skill levels, changed section sorts, collapsed sections, and navigated to a deep-link hash

When the visitor activates Reset

Then search text clears, all skill levels are selected, every section returns to its default sort, collapsed sections expand, the view scrolls to the top, and the hash/deep-link state clears

## Scenario: Item dates render in predecessor format

Given items with various combinations of present and missing start and end dates

When the resume renders those items

Then a present start renders as `M.YYYY` followed by the predecessor's non-breaking-space-and-hyphen separator (for example `7.2001&nbsp;-`), a missing start with a present end renders `until`, a present start with a missing end renders `current`, and a missing start and end renders the item as `current` in the end position with nothing in the start position

## Scenario: Markdown renders consistently across modes

Given governed `about.content` and item descriptions contain markdown using headings, unordered lists, paragraphs, emphasis, strong, links, and owner-authored raw HTML

When the resume renders in interactive mode and in static mode

Then both modes use the same markdown renderer and configuration, the rendered output is byte-identical across modes, all of those markdown features render, and the owner-authored raw HTML is preserved rather than stripped under the phase-1 trusted-source posture

## Scenario: Governed data failure never ships a broken resume

Given the governed resume data source fails to parse or transform, or is malformed

When the phase-1 build-time load processes that source

Then the build/prerender fails so the broken data never reaches production, and if a runtime-fetch/hydration mode is used instead, the app keeps the navigation and header shell visible and shows an explicit visitor-safe error state rather than a blank page or a leaked diagnostic

## Scenario: Visitor renders the static resume

Given the governed resume data contains multiple resume sections

When a visitor opens static resume mode

Then all governed resume data is visible in traditional canonical order, fully expanded, without requiring search, filters, chat, hover, or JavaScript-only disclosure, and markdown text, public links, visible URLs, date formatting, item levels, and section names are preserved

## Scenario: Surfaces expose predecessor browser metadata

Given the interactive and static resume surfaces have rendered

When a visitor or crawler inspects the page metadata

Then the page title is `Chad Woolley - Resume`, a description meta tag is present, viewport metadata uses `width=device-width, initial-scale=1, shrink-to-fit=no` or a documented equivalent, favicon and app icons (or their documented replacements) are served, robots and canonical behavior is consistent with the preview-non-index rule, a web app manifest with standalone display metadata and app icons at least equivalent to 192x192 and 512x512 is served, and the layout has no horizontal scroll on supported viewports

## Later-phase scenarios (non-load-bearing in phase 1)

## Scenario: Visitor asks an answerable AI question

Given the governed resume data contains facts relevant to a visitor's question

When the visitor asks that question in AI-driven mode

Then the app returns a grounded answer with citations to the supporting resume data

## Scenario: Visitor asks a partially answerable AI question

Given the governed resume data covers only part of a visitor's question

When the visitor asks that question in AI-driven mode

Then the app returns a partial answer with citations for the supported portion and states what the governed data does not cover

## Scenario: Visitor asks an unanswerable AI question

Given the governed resume data does not contain the requested fact

When the visitor asks for that fact in AI-driven mode

Then the app states that the resume data does not contain the answer and does not invent a fact

## Scenario: Visitor makes an unsafe or off-topic AI request

Given a visitor request that matches the decline rules in `spec.md`

When the visitor submits that request in AI-driven mode

Then the app returns a declined response that states its reason category and does not fabricate resume facts

## Scenario: AI provider failure does not break the resume

Given the AI provider is unavailable or misconfigured

When a visitor opens interactive or static resume mode

Then the resume still renders without requiring AI mode to succeed

## Scenario: Future MCP client reads governed resume data

Given MCP support has been implemented

When an MCP client requests the structured resume data resource or tool

Then the server returns governed resume data without exposing secrets, local files, or ungoverned memory
