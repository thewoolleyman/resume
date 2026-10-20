---
topic: factory-routing
author: claude-opus-5-5
created_at: 2026-10-20T15:12:43Z
---

## Proposal: Factory routing

### Target specification files

- non-functional-requirements.md

### Summary

Add a `## Factory routing` section requiring every committed dispatcher.factories entry in .livespec.jsonc to be registry-backed ("registry": true, no server, no docker_host) so no committed factory entry names a machine, and requiring dispatcher.default_factory to name legacy.

### Motivation

Coordinator rulings R318 and R320 (2026-10-20, plan petri-factory-on-gmktec, epic bd-ib-fyozyd) require every fleet repository's committed factory table to be registry-backed and name no machine; a factory is bound to a machine only in the fleet gitops inventory's factory registry. This heading is the governing clause the registry-switch work-item references.

### Proposed Changes

Add this H2 and body verbatim in `non-functional-requirements.md`, immediately before the `## Scenarios` H2 (after the `## Constraints` group). It is placed in `non-functional-requirements.md` rather than `constraints.md` because dispatch factory routing is a contributor-only concern under this repository's §"Boundary" taxonomy (`constraints.md` holds only constraints visible to users or deployers):

## Factory routing

Every entry this repository commits in `.livespec.jsonc` under `dispatcher.factories` MUST be registry-backed: it declares `"registry": true` and carries no `server` and no `docker_host` value, so no committed factory entry names a machine. Which Fabro server answers to a factory name is bound only in the fleet gitops inventory's factory registry (livespec-dev-tooling `non-functional-requirements.md` §"Fabro factory registry"), which each dispatching host renders as `/etc/livespec/fabro-factories.json`; a dispatch resolves a registry-backed entry from that file by name. `dispatcher.default_factory` MUST name `legacy`.
