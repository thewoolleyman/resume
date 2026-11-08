---
topic: this-repository-s-sessionstart-hook
author: claude:gmktec-factory-placement
created_at: 2026-11-08T00:15:52Z
---

## Proposal: Session plugin provisioning holds an installed orchestrator build

### Target specification files

- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/scenarios.md

### Summary

Adds to non-functional-requirements.md §"Hooks" a rule that the SessionStart provisioner never updates or reinstalls an installed orchestrator plugin build, installs it when absent, and keeps provisioning every other plugin, with a matching scenario. It mirrors livespec-dev-tooling spec v155 §"Orchestrator build adoption" for a repository whose hook does not run that library.

### Motivation

The fleet's host dispatcher resolves this repository's factory launch build from its project-scope install of livespec-orchestrator-beads-fabro. `.claude/hooks/ensure-plugins.ts` runs `claude plugin install` and `claude plugin update` for every enabled plugin on every session start, so each session moves that launch build with no roll step. livespec-dev-tooling spec v155 (livespec-dev-tooling#3734) makes the orchestrator build move only through the operator step `just adopt-orchestrator-build <clone> <build>`. Its rules reach only repositories whose hook runs that library's `ensure-plugins`, and this repository's hook does not. §"Hooks" governs the hook but says nothing about the orchestrator build. The fix item is li-z3ynyp. The topic name matches the slug this fleet's spec-change tier derives from that item's title (its homelab twin hl-jq6ov3 recorded exactly `this-repository-s-sessionstart-hook`), so a spec-change tier record for li-z3ynyp clears when this ratifies. Filed and revised by the livespec-dev-tooling plan seat gmktec-factory-placement under this ruling, recorded verbatim: Coordinator ruling (legacy-coordinator-agent, session 8e04c5e0, R301 plus the maintainer's 2026-08-26 "I authorize all revises"): option (a). (Issued for homelab; the same message ruled that "openbrain and resume get the same proposal under this same ruling".) Basis: the paragraph (CLAUDE.md about l.298, AGENTS.md l.341-347, dated 2026-08-27) requires spec work inside WORKER sessions of the foreman/worker model. That transport has been retired fleet-wide: the console plan's decisions D1, D4 and D5 retired tmux worker sessions, and dev-tooling applies that now. Homelab has no worker or seat in the roster, so read literally the paragraph means homelab can never revise at all. That is not its purpose, which was to stop ad-hoc work from bypassing the worker flow. A plan seat running the normal propose-change and revise path, with my answers to its pickers and the record kept, is today's equivalent of that flow. Your draft only mirrors ratified v155.

### Proposed Changes

In `non-functional-requirements.md` §"Hooks" (an H3, so no H2 changes), append this paragraph:

> The SessionStart provisioner `.claude/hooks/ensure-plugins.ts` MUST hold an installed orchestrator plugin build. The fleet's host dispatcher resolves this repository's factory launch build from its project-scope install of `livespec-orchestrator-beads-fabro@livespec-orchestrator-beads-fabro`, so a provisioner that moves that install changes the launch build as a side effect of a session lifecycle event; that plugin moves only through livespec-dev-tooling's operator step `just adopt-orchestrator-build <clone> <build>` (livespec-dev-tooling `contracts.md` §"Orchestrator build adoption", ratified in its spec v155). When the committed settings enable the orchestrator plugin and `installed_plugins.json` has an install record for it whose project path is the working directory, the provisioner MUST NOT run `claude plugin update` or `claude plugin install` for that plugin and MUST leave that record unchanged, whichever build the marketplace offers, and MUST print one line naming the plugin, the installed build and the record's `lastUpdated` value; holding the build MUST NOT make the hook fail. When no install record has the working directory as its project path, it MUST install the build the marketplace offers, a linked worktree included. It MUST still install and update every other enabled plugin. This applies on every SessionStart source, in interactive and headless sessions alike.

In `scenarios.md`, append:

> ## Scenario: Session start holds the installed orchestrator build
> 
> Given the committed settings enable the orchestrator plugin and this checkout already has a project-scope install record for it
> 
> When a session starts and the marketplace offers a different orchestrator build
> 
> Then the SessionStart provisioner MUST leave that install record unchanged and print one line naming the plugin, the installed build and the record's `lastUpdated` value
> 
> And it MUST still install and update every other enabled plugin, MUST install the offered orchestrator build in a checkout that has no install record for it, and MUST NOT fail because it held the build

In `.livespec.jsonc`, allowlist `SPECIFICATION/contracts.md §"Orchestrator build adoption"` under `external_references.livespec-dev-tooling`.
