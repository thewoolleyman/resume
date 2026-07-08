---
topic: reject-invalid-skill-levels
author: claude-opus-4-8
created_at: 2026-07-08T22:17:25Z
---

## Proposal: Invalid governed data is not allowed — reject invalid skill levels at load; migrate legacy invalid data

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md
- SPECIFICATION/scenarios.md

### Summary

Ratify the repository owner's decision (2026-07-09) that invalid governed data
is NOT allowed. Specifically, an item skill `level` that is present but is not
one of the five defined keys (`played`, `once`, `often`, `toolbox`, `teach`) is
**malformed governed data** and MUST be rejected at load — failing the
build/prerender under the phase-1 build-time load, or the visitor-safe error
state under a runtime load path — exactly like a missing `about`/`header` group
or a nameless item. This REMOVES the current phase-1 "invalid legacy level stays
visible with an `unknown level` explanation" tolerance from `contracts.md`. If
legacy governed data ever contains an invalid level, a planned migration step
MUST convert it to a valid level before it is loaded, rather than the app
tolerating it at runtime. The `unspecified` filter key (how a no-level item
behaves) is unchanged; only NON-DEFINED level VALUES are rejected.

### Motivation

The prior contract carried a defensive "invalid legacy level" runtime tolerance
inherited from the predecessor's dev/test fixture. This created a governance
conflict during phase-1: the scenario "Item with an invalid legacy skill level
stays visible" was classified browser-observable and mapped to a Playwright
test, but the pinned production data forbids invalid levels, so no Playwright
test could ever observe it against the real app. The owner has ruled that
invalid data simply should not be allowed: reject it as malformed at load (a
build/prerender failure, non-browser-exercisable like the other malformed-data
rejections), and migrate any legacy invalid data to valid data as a planned
step. This removes the conflict, simplifies the domain/rendering logic (no
"unknown level" runtime branch), and keeps the governed source strictly valid.

### Proposed Changes

1. **spec.md §"Governed data source and predecessor import (phase 1)"** — the
   sentence about `unspecified`/invalid levels. Change from "those two cases
   exist only as defensive handling for the predecessor's development/test
   fixture and MUST NOT be introduced into the committed production snapshot" to
   state that a present-but-non-defined level VALUE is malformed governed data
   that MUST be rejected at load (per contracts.md §"Governed data source
   contract"), and that any legacy invalid level MUST be migrated to a valid
   level before load rather than tolerated at runtime. (A no-level item still
   behaves as `unspecified`; only non-defined present values are rejected.)

2. **contracts.md §"Governed data source contract"** — extend the malformed-data
   rejection list so a section item whose `level` is present but not one of the
   five defined keys is rejected as malformed (build/prerender failure, or the
   runtime visitor-safe error state), alongside the missing-group and
   nameless-item cases.

3. **contracts.md §"Skill-level filtering"** — REMOVE the paragraph beginning
   "Items with an invalid legacy level — a level value that is not one of the
   defined keys — MUST remain visible ... exposes an `unknown level`
   explanation ...". Replace with: a present item `level` MUST be one of the
   five defined keys or the source is rejected at load; a no-level item behaves
   as `unspecified` and renders no badge (unchanged). The Skill Levels control
   still defaults to all levels selected and toggles each independently.

4. **contracts.md §"Item rendering"** — REMOVE the sentence "An invalid legacy
   level MUST keep the item visible and MUST expose a diagnostic label such as
   `unknown level` instead of silently dropping the item." The level indicator
   renders the defined level key (with its meaning on hover/focus); a no-level
   item renders no indicator. There is no `unknown level` runtime state, since
   invalid levels are rejected at load.

5. **scenarios.md** — REPLACE the scenario "Item with an invalid legacy skill
   level stays visible" with a scenario "Invalid skill level is rejected at
   load" (a governed-data source with a present-but-non-defined item level is
   rejected — failing the build/prerender under the phase-1 build-time load, or
   the visitor-safe error state under a runtime path — rather than rendered).
   This scenario is **non-browser-exercisable** (build-prerender-check /
   vitest), mapping to the load/transform rejection test, mirroring the existing
   "Malformed governed data is rejected at load" and "Invalid sort input falls
   back to default order" classifications. The scenario-coverage mapping and the
   check-scenarios.ts `EXPECTED_CLASS` pin are updated accordingly by the
   implementing change.

Downstream (implementation, tracked in plan/mvp): the transform rejects invalid
levels (new `invalid-level` DomainError or reuse of `invalid-item`); the domain
`isInvalidLevel` / `unknown level` handling and the "invalid stays visible"
filter branch are removed; the mapped scenario test becomes a load-rejection
test; and a planned migration step is added for any future legacy invalid data.
