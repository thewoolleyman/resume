---
topic: default-factory-petri
author: claude-opus-5-5
created_at: 2026-10-22T22:18:34Z
---

## Proposal: Default factory names petri

### Target specification files

- non-functional-requirements.md

### Summary

Change the last sentence of `## Factory routing` so `dispatcher.default_factory` MUST name `petri` instead of `legacy`. Nothing else in the section changes: every committed `dispatcher.factories` entry stays registry-backed with no `server` and no `docker_host`, and the registry binding rule is unchanged.

### Motivation

Maintainer direction relayed by coordinator session gitops-fleet-capacity-monitoring as ruling R668 moves every fleet repository's dispatch default to `petri`, the current Fabro server; rulings R669 and R672 approve this spec revise as a delegated decision. Tracked by work-item bd-ib-iud52v (plan petri-factory-on-gmktec, epic bd-ib-fyozyd). The orchestrator's factory resolver resolves the registry-backed `petri` entry through `/etc/livespec/fabro-factories.json` to the Fabro server for environment livespec-ci. The ratified sentence currently names `legacy`, so the committed cutover in `.livespec.jsonc` needs this clause changed in the same branch.

### Proposed Changes

In `non-functional-requirements.md` §"Factory routing", replace the sentence

`dispatcher.default_factory` MUST name `legacy`.

with

`dispatcher.default_factory` MUST name `petri`.

No other sentence in the section changes, and no `## ` heading is added, renamed or removed.
