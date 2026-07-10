---
proposal: permit-owner-pii-redaction-in-snapshot.md
decision: accept
revised_at: 2026-07-10T02:11:51Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Owner/maintainer directed removal of their postal address from the public resume site for privacy on 2026-07-10. The blanket byte-verbatim snapshot rule cannot accommodate a legitimate owner-authorized PII redaction; this amendment permits recorded, re-pinned redactions (retrieved-source hash retained as provenance, committed-snapshot hash re-pinned) while preserving the pinned production scope and header.contact as a governed field. No scenario/contract change needed.

## Resulting Changes

- spec.md
