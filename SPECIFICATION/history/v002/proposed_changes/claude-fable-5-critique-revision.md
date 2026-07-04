---
proposal: claude-fable-5-critique.md
decision: modify
revised_at: 2026-07-04T09:27:41Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-fable-5
---

## Decision and Rationale

All seven findings correctly apply the livespec fleet boundary litmus (contributor/build/deploy discipline belongs in non-functional-requirements.md; only consumer-inherited surface stays in the user-facing files) and the NLSpec define-once principle, directly implementing the user's critique steering intent. The user confirmed acceptance of all seven proposals in the per-proposal dialogue.

## Modifications

Accepted all seven proposals as filed, plus one consequential edit the proposals did not name: SPECIFICATION/README.md's file descriptions are updated to stay consistent with the moved content (contracts.md no longer lists repository command contracts; non-functional-requirements.md now carries the contributor toolchain and repository command contracts; spec.md's description now names product behavior and intent rather than the livespec-first workflow).

## Resulting Changes

- spec.md
- contracts.md
- constraints.md
- non-functional-requirements.md
- scenarios.md
- README.md
