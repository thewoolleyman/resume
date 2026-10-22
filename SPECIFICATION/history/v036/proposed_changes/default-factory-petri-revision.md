---
proposal: default-factory-petri.md
decision: accept
revised_at: 2026-10-22T22:25:27Z
author_human: Chad Woolley <thewoolleyman@gmail.com>
author_llm: claude-opus-5-5
---

## Decision and Rationale

Accepted under this repository's delegated revise_decision_mode as the spec half of the petri default-factory cutover: maintainer direction relayed by coordinator session gitops-fleet-capacity-monitoring as ruling R668 moves dispatcher.default_factory to petri, the current Fabro server, and rulings R669 and R672 approve this revise as a delegated decision (work-item bd-ib-iud52v; plan petri-factory-on-gmktec, epic bd-ib-fyozyd). The change replaces only the default-factory sentence of the Factory routing section; the registry-backed and no-hostname rules are unchanged and no heading changes. This repository declares no legacy entry, so the new clause names only petri; its remaining hostname-literal hp and default entries are a pre-existing nonconformance owned by work-item li-4dhfyu. The same branch commits the .livespec.jsonc cutover; the orchestrator's resolver resolves the registry-backed petri entry through /etc/livespec/fabro-factories.json to gmktec-xubuntu:32276, environment livespec-ci. Independent ratification review, two separate read-only reviewers over these exact bytes: the configured reviewer Fable 5.1 (fable), separately spawned under this repository's auto-spawn ratification_review, returned NO BLOCKERS at 2026-10-22T22:23:22Z on digest d771a187; and gpt-6-astra via a read-only Codex exec, required by R672 for this cutover, returned NO BLOCKERS at 2026-10-22T22:22:44Z on the same proposal and spec diff, in one round. Their non-blocking nits concerned stale .livespec.jsonc comments and the factory test, which the same branch fixes.

## Resulting Changes

- non-functional-requirements.md

## Ratification Review

ratification_review: auto-spawn
reviewer_model: fable
reviewer_identity: fable
separate_reviewer: True
read_only: True
reviewed_at: 2026-10-22T22:23:22Z
verdict: NO BLOCKERS
proposal_stem: default-factory-petri
content_digest: d771a18783dbda856e87c52656a617bf23eef1afdaa94311ee18ce826e51d0d8
