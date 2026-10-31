---
topic: fail-bun-run-check-when
author: claude-opus-5-5 (petri-factory-on-gmktec)
created_at: 2026-10-31T18:33:32Z
---

## Proposal: The aggregate check enforces factory routing

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

Extend §"Factory routing" so that `bun run check` mechanically enforces its two MUST rules (every committed `dispatcher.factories` entry is registry-backed with no `server` and no `docker_host`; `dispatcher.default_factory` names `petri`) and, on a violation, exits non-zero naming the offending entry and key, or the configured `default_factory` value. Add one matching scenario under §"Scenarios".

### Motivation

§"Factory routing" states MUST rules for the committed `.livespec.jsonc`, but nothing enforces them: a later edit that re-introduces a machine-naming `server` or `docker_host`, or changes `default_factory`, would land green. Every other contributor-facing MUST in this file that is mechanically checkable is wired into the aggregate command (§"Aggregate command"), and this one is not. Filed to release work-item li-zxiofh (the gate implementation), under coordinator ruling R301.

### Proposed Changes

In `SPECIFICATION/non-functional-requirements.md` §"Factory routing", append this paragraph after the existing one:

> The aggregate check command (§"Aggregate command") MUST enforce both rules above against the committed `.livespec.jsonc`, parsing it as JSONC because the file carries comments. When any `dispatcher.factories` entry lacks `"registry": true` or carries a `server` or `docker_host` value, the check MUST exit non-zero and its failure output MUST name that entry and each offending key. When `dispatcher.default_factory` names anything other than `petri`, the check MUST exit non-zero and its failure output MUST name the configured value. The gate MUST be standalone per `constraints.md` §"Standalone boundary" (local TypeScript/Bun tooling; no livespec fleet Python tooling).

Under `SPECIFICATION/non-functional-requirements.md` §"Scenarios", add:

> ### Scenario: Aggregate check enforces factory routing
>
> Given the committed `.livespec.jsonc` carries a `dispatcher.factories` entry with a `server` or `docker_host` value, or without `"registry": true`, or a `dispatcher.default_factory` other than `petri`
>
> When a contributor runs the aggregate check command
>
> Then the check MUST exit non-zero and name the offending factory entry and key, or the configured default-factory value; and against a conforming `.livespec.jsonc` the factory-routing gate MUST pass
