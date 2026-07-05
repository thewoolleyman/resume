# AI-centric interactive resume - scenarios

## Scenario: Governed data preserves the predecessor data shape

Given the predecessor resume defines an about group, a header, and named sections of items with names, optional levels, optional start/end values, and markdown descriptions

When the predecessor content is imported into the governed structured data source

Then the governed data exposes `about.title`, markdown `about.content`, `header.name`, `header.contact`, and the predecessor's ordered section inventory with each item carrying a stable identifier and its predecessor fields

## Scenario: Visitor opens the interactive resume

Given the production site has governed resume data

When a visitor opens `https://resume.thewoolleyweb.com/`

Then the visitor sees the interactive resume with profile information, the sticky navigation bar, section navigation, and resume items rendered from the governed data

## Scenario: Visitor uses the About and Instructions controls

Given the interactive resume has rendered

When the visitor opens the About control and the Instructions control from the sticky navigation bar

Then the app presents the about content and usage instructions without leaving interactive mode

## Scenario: Visitor navigates to a stable resume item

Given a resume item has a stable identifier

When a visitor opens a URL that targets that item

Then the app reveals the matching item after data loading completes

## Scenario: Visitor follows a legacy section anchor

Given a visitor opens a URL containing a legacy `#list-<ordinal>` section hash

When data loading and rendering complete

Then the app reveals the matching section without leaving it hidden under the sticky navigation bar, resolving the legacy hash through a preserved alias or a deterministic redirect to the stable section identifier

## Scenario: Visitor searches the interactive resume

Given the governed resume data contains items matching a search term

When the visitor searches for that term in interactive mode

Then only matching items are shown, clearing the query restores the default ordered view, and a term with no matches shows a no-results state without leaving interactive mode

## Scenario: Search matches markdown-stripped description text

Given a resume item whose markdown description contains a word only inside markdown or HTML syntax and another word in its plain-text prose

When the visitor searches for each word in interactive mode

Then the plain-text prose word matches the item and the markdown/HTML syntax word does not

## Scenario: Visitor filters by skill level

Given resume items carry the predecessor skill levels and some items have no level

When the visitor toggles individual levels in the Skill Levels control

Then the control starts with all levels selected, toggling a level shows or hides only items at that level, items with no level behave as `unspecified`, and the UI explains what each level means

## Scenario: Item with an invalid legacy skill level stays visible

Given a resume item carries a skill level that is not one of the defined levels

When the resume renders and skill-level filtering is applied

Then the item remains visible and the app exposes an implementation-visible diagnostic rather than silently dropping the item

## Scenario: Visitor sorts a section

Given a section contains items with names and start/end dates

When the visitor selects each available sort option for that section

Then Default preserves canonical data order, name sorts order by item name, and date sorts order by parsed start/end dates with item-name tie-breakers and missing end dates treated as current

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

Then a present month/year renders as `M.YYYY`, a missing start with a present end renders `until`, a present start with a missing end renders `current`, and a missing start and end renders the item as current

## Scenario: Markdown renders consistently across modes

Given governed `about.content` and item descriptions contain markdown

When the resume renders in interactive mode and in static mode

Then the markdown renders consistently in both modes under the documented sanitization rules

## Scenario: Resume renders when data loading fails

Given the governed resume data source fails to load

When a visitor opens the resume

Then the app shows an explicit error state written for visitors rather than a blank page or a leaked diagnostic

## Scenario: Visitor renders the static resume

Given the governed resume data contains multiple resume sections

When a visitor opens static resume mode

Then all governed resume data is visible in traditional canonical order, fully expanded, without requiring search, filters, chat, hover, or JavaScript-only disclosure, and markdown text, public links, visible URLs, date formatting, item levels, and section names are preserved

## Scenario: Surfaces expose predecessor browser metadata

Given the interactive and static resume surfaces have rendered

When a visitor or crawler inspects the page metadata

Then the page title is `Chad Woolley - Resume`, viewport metadata is present, favicon and app icons (or their documented replacements) are served, robots and canonical behavior is consistent with the preview-non-index rule, and the layout has no horizontal scroll on supported viewports

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
