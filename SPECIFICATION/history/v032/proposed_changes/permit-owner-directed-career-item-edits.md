---
topic: permit-owner-directed-career-item-edits
author: claude-opus-4-8
created_at: 2026-07-10T17:15:00Z
---

## Proposal: Permit owner-directed edits to an individual career item's factual fields

### Target specification files

- SPECIFICATION/spec.md

### Summary

Broaden the sanctioned owner-authored content-edit category in spec.md
§"Governed data source and predecessor import (phase 1)" so that, where the owner
explicitly directs it, an individual resume item's factual fields — its display
`name`, its `start` and `end` dates, and its markdown description — MAY be edited to
record a real-world career change, not just the item's description. The committed
snapshot's own SHA-256 MUST be re-pinned (provenance comments, `src/lib/data/import.test.ts`,
and this spec) exactly as for any other owner-directed edit; the retrieved-source
hash and the pinned production scope (18 keys / 16 sections / 74 items) are unchanged.

### Motivation

The maintainer/owner directed an update to the current GitLab role on 2026-07-10 to
reflect a real employment change: retitle from "Senior Fullstack Engineer, GitLab" to
"Staff Fullstack Engineer, GitLab", add an `end` date of `2026-06-15` (the owner was
laid off), and rewrite its description. The previously sanctioned edit category (2)
covered `about.title`, `about.content`, and "individual item descriptions" only — it
did not cover an item's display `name` or its `start`/`end` dates, which are career-fact
fields under predecessor parity. `src/lib/data/import.test.ts` additionally pinned
`gitlab.end === null`. A blanket freeze on item name/date fields cannot accommodate a
legitimate, owner-authorized career update; the fix is to permit recorded, re-pinned
owner-directed edits to those fields rather than to silently bump a hash. Editing a
display `name` legitimately re-derives that item's stable identifier and public anchor
per §"Stable item identifiers", which is the intended behavior when a display name
changes.

### Proposed Changes

In SPECIFICATION/spec.md §"Governed data source and predecessor import (phase 1)":

1. Amend the sanctioned-edit-categories sentence. Extend category (2) so its
   owner-directed parenthetical reads "an individual resume item's factual fields — its
   display `name`, its `start` and `end` dates, and its markdown description — to record
   a real-world career change such as a role retitle or a departure end date" (replacing
   the narrower "individual item descriptions"). Add a sentence noting that an
   owner-authored edit to an item's display `name` re-derives that item's stable
   identifier and public anchor per §"Stable item identifiers", which is the intended
   behavior when the display name legitimately changes.

2. Re-pin the committed-snapshot SHA-256 in the pinned-provenance sentence to
   `901ad39f4725f6667265024300327fa6d9bcc10d59f87475ec1d4c5920e2c405`, and record that it
   reflects three 2026-07-10 owner-directed edits: the postal-address redaction, the
   about.content rewrite, and the GitLab-role update (Senior→Staff retitle, added
   2026-06-15 end date, rewritten description). Re-pin the same hash in the file's
   provenance comments and in `src/lib/data/import.test.ts`.

3. Add a caveat to the "import MUST preserve, at minimum" list item covering an item's
   fields: per the sanctioned owner-authored content-edit category, the owner MAY revise
   an individual item's display name, `start`/`end` dates, or markdown description; such
   an edit changes field VALUES only and still preserves the item, its order, and its
   `level` presence.

State explicitly that the pinned production scope (18 top-level keys, 16 sections,
74 items) is UNCHANGED by an owner-directed career-item edit; the edit revises field
VALUES within a preserved item and MUST NOT drop or add any top-level key, section, or
item.

No contracts.md, constraints.md, or scenarios.md change is required: the
predecessor-data-model-parity scenarios assert that each item exposes and preserves its
display name, dates, and description fields, which remains true after the edit; the
byte-verbatim provenance is a data-governance invariant recorded/enforced via the
provenance comments and import.test.ts, not a Gherkin behavior. The browser-observable
sort and date-rendering scenarios continue to hold on the updated data (their e2e
examples are re-pointed to open-ended items so the missing-end behavior stays exercised),
without weakening any assertion.
