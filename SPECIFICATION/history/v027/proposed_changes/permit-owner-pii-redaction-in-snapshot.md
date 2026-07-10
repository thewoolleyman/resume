---
topic: permit-owner-pii-redaction-in-snapshot
author: claude-opus-4-8
created_at: 2026-07-10T02:10:08Z
---

## Proposal: Permit owner-directed PII redaction in the committed snapshot

### Target specification files

- SPECIFICATION/spec.md

### Summary

Relax the governed-data provenance model in spec.md §"Governed data source and predecessor import (phase 1)" so the committed data/resume.yml is the predecessor PRODUCTION import that MAY carry owner-directed personal-information (PII) redactions applied for privacy, rather than requiring it to be byte-identical to the retrieved source. The retrieved-source provenance (including its SHA-256) MUST still be recorded, every redaction MUST be recorded with its date, and the committed snapshot's OWN SHA-256 (over the redacted content) MUST be re-pinned in the file header, in src/lib/data/import.test.ts, and in this spec.

### Motivation

The maintainer/owner directed removal of their home postal address from the public resume site (https://resume.thewoolleyweb.com) on 2026-07-10 for privacy; header.contact must show only phone and email. The current spec pins data/resume.yml as a byte-verbatim predecessor snapshot (SHA-256 792097b0...), enforced by import.test.ts and this spec, which forbids that redaction. A blanket "verbatim" rule cannot accommodate a legitimate, owner-authorized privacy redaction; the fix is to permit recorded, re-pinned redactions rather than silently bump a hash.

### Proposed Changes

In SPECIFICATION/spec.md §"Governed data source and predecessor import (phase 1)":

1. Amend the "Committed production snapshot" paragraph. Replace the requirement that the committed snapshot be "A verbatim snapshot of that production content ... byte-identical to the retrieved source" with: the committed snapshot MUST be transcribed from the predecessor's production content and MAY carry owner-directed personal-information (PII) redactions applied for privacy (e.g., removing the owner's postal address from `header.contact`); it therefore need not be byte-identical to the retrieved source. The repository MUST record in the file's leading YAML provenance comments BOTH (a) the retrieved-source provenance — source URL, retrieval date, upstream `Last-Modified`, and the SHA-256 of the retrieved bytes (the pre-redaction predecessor hash) — AND (b) every owner-directed redaction with its date and what was removed. The committed snapshot's OWN SHA-256, computed over the redacted on-disk content, MUST be pinned in the file's provenance comments, in `src/lib/data/import.test.ts`, and in this spec.

2. Update the pinned-provenance sentence to carry two hashes: retrieved-source SHA-256 `792097b01aef31fdc7cbf2c2463492e87c5ca89bc8d864ef3ebacfc7f7a4d158` (source https://interactive-resume-data-chad-woolley.gitlab.io/interactive-resume-data-chad-woolley.yml, retrieved 2026-07-06, upstream Last-Modified 2022-06-27) as the pre-redaction predecessor hash; and committed-snapshot SHA-256 `20600aea8cdb06d797904921eb0259b96663a4a1acfaba1aa3265fccf5607c9e`, reflecting the 2026-07-10 owner-directed redaction of the postal address from `header.contact` (leaving phone and email).

3. State explicitly that the pinned production scope (exactly 18 top-level keys — `about`, `header`, and 16 sections — and 74 items in total) is UNCHANGED by a PII redaction; a redaction removes characters within a preserved field's value and MUST NOT drop or add any top-level key, section, or item.

4. Leave the "import MUST preserve, at minimum" list intact, including `header.name` and `header.contact`: `header.contact` is still preserved as a governed field; only owner-directed PII within its value is redacted.

No scenario change is required: the existing predecessor-data-model-parity scenarios assert that `header.contact` is exposed and preserved as a string, which remains true after redaction; the byte-verbatim provenance is a data-governance invariant recorded/enforced via the provenance comments and import.test.ts, not a Gherkin behavior. No contracts.md, constraints.md, or scenarios.md change is needed.
