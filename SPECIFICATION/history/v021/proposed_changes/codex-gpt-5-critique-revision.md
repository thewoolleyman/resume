---
proposal: codex-gpt-5-critique.md
decision: modify
revised_at: 2026-07-07T06:18:08Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Both proposals in codex-gpt-5-critique are valid, load-bearing functional (Phase FN) findings that refine — not reverse — settled ground (the v006 name-based item-anchor design and the v008 date-rendering decision), and neither touches the converged coverage/TDD rules, so they clear the FN critique bar. Proposal 1 (item-anchor composition underdefined) is ACCEPTED and its requested 'choose one deterministic algorithm' directive is fulfilled by pinning: item id = base section slug + single hyphen + item-title slug, each slugified independently; item-level -2/-3 collision suffixes appended to the fully composed id in governed data order; section-level collision suffixes do NOT participate. Base (pre-collision) section slug is required — not merely chosen — because spec.md already mandates item ids 'change only when the item's section display name or item display name changes'; a disambiguated section slug would shift item ids when an unrelated section is added/reordered, violating that clause. Worked example uses the real, hash-verified production dataset (Job History / 'Senior Software Engineer, Pivotal' -> job-history-senior-software-engineer-pivotal). Proposal 2's FINDING (present-end rendering implicit) is ACCEPTED and all four start/end combinations are now enumerated, but its suggested concrete example was MODIFIED: the critique proposed an inline glued string '7.2001&nbsp;-8.2001', whereas the authoritative predecessor source (../interactive-resume.gitlab.io/util/transformData.js) renders the date column as two independent positions — start = '{M.YYYY}&nbsp;-', end = bare '{M.YYYY}' — and never concatenates them; the existing spec/scenario already use the start-position/end-position framing. The example is therefore pinned to per-position values verified against that source and the hash-pinned production item (start 2006-04-15 -> 4.2006&nbsp;-, end 2019-10-29 -> 10.2019). Hence the file-level verb is 'modify'.

## Modifications

spec.md §'Stable item identifiers': replaced the single-sentence 'derive from section display name and item display name, slugified' with a 3-step pinned composition (slug each label independently using the base section slug; join with one hyphen as <section-slug>-<title-slug>; append item-level -2/-3 collision suffixes to the composed id in data order), an explicit statement that section-level collision suffixes do not participate, a real worked example, and a refined stability clause naming the collision suffix as the sole exception. contracts.md §'Resume data contract': rewrote the item-`id` sentence to reference the pinned <section-slug>-<title-slug> composition (removing the muddy 'that section's slug-collision disambiguation rule' phrasing) and added the worked-example anchor. contracts.md §'Item rendering': added an explicit two-position (start/end) model, stated the present-end rendering as bare M.YYYY with no separator, and added a four-row table covering every start/end presence combination with per-position values, replacing the critique's inline '7.2001&nbsp;-8.2001' with source-verified per-position values. scenarios.md §'Import derives stable item anchors deterministically': Then-clause now references the pinned composition and the worked-example anchor. scenarios.md §'Item dates render in predecessor format': Then-clause now asserts a concrete present-start/present-end example (4.2006&nbsp;- / 10.2019) and the bare-M.YYYY end rendering, keeping the existing missing-date cases.

## Resulting Changes

- spec.md
- contracts.md
- scenarios.md
