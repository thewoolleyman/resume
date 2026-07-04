# AI-centric interactive resume - non-functional requirements

## Boundary

`non-functional-requirements.md` covers how this TypeScript resume app is built, tested, and maintained, including the contributor toolchain, repository command contracts, and contributor-workflow scenarios. User-facing product behavior belongs in `spec.md`; browser, data, AI, and MCP contracts belong in `contracts.md`; runtime and architecture constraints visible to users or deployers belong in `constraints.md`; user-facing acceptance examples belong in `scenarios.md`.

The project intentionally adopts livespec fleet discipline without depending on livespec fleet repositories; the standalone rule is defined once in `constraints.md` §"Standalone boundary". Requirements in this file MUST be implemented with standalone TypeScript, Bun, Vercel, GitHub, and local repository tooling unless a future proposed change explicitly adds a dependency.

## Spec

### Livespec governance

The repository MUST remain livespec-first. Product, contract, constraint, and non-functional changes MUST flow through livespec proposed changes and revisions before implementation work relies on them. Implementation work MUST treat the accepted specification as authoritative and MUST update it before or with any behavior change.

The project MUST dogfood the livespec Codex driver and the git-jsonl orchestrator. The workflow MAY borrow practices from the wider livespec fleet. Work items SHOULD be tracked through the selected orchestrator once the repository is ready for implementation planning.

### Test-Driven Development discipline

Behavioral implementation work MUST follow Red -> Green -> Refactor. A feature or fix changeset MUST include a failing test that demonstrates the missing behavior before the implementation turns it green. Refactors MUST preserve the existing green suite.

For UI behavior, the preferred red test is a Playwright or integration test that observes user-visible behavior. For pure data transforms, search, grounding, and contract logic, the preferred red test is a Vitest unit or property test.

### Top-of-pyramid discipline

Every `## Scenario:` heading in `SPECIFICATION/scenarios.md` MUST be mapped to an end-to-end or integration test before the scenario is treated as implemented. Unit tests MAY support the implementation, but they do not satisfy scenario coverage by themselves.

This coverage gate applies only to `SPECIFICATION/scenarios.md`. Scenarios in this file's own "Scenarios" section are contributor-workflow scenarios and are satisfied by repository and CI configuration (for example, a required GitHub check wired to the aggregate check command), not by Playwright tests.

### Definition of done for implementation work

An implementation change is not done until the aggregate check command passes locally or the remaining failure is explicitly documented as external to the change. The aggregate check MUST include typechecking, linting, format checks, unit tests, integration tests when present, Playwright end-to-end tests, and any spec or scenario coverage checks introduced by the project. Vercel production and preview constraints MUST remain satisfied before merge.

## Contracts

### Contributor toolchain

The preferred toolchain is TypeScript with Bun for package management and script execution, Vitest for unit and integration tests, Playwright for browser end-to-end tests, and Vercel for deployment. The repository MUST pin tool versions or otherwise document the version-selection mechanism so a fresh checkout can reproduce the same checks.

### Aggregate command

The canonical aggregate check command is `bun run check`. It MUST be non-mutating and MUST run the checks required by "Definition of done for implementation work". A `just check` wrapper MAY additionally be provided, but it MUST only delegate to `bun run check`. CI and hooks MUST delegate to the aggregate command or to documented subcommands rather than embedding divergent tool invocations.

### Package script categories

The repository SHOULD provide these command categories:

| Command category | Required behavior |
|---|---|
| Bootstrap | Install pinned dependencies and local hooks. |
| Dev server | Run the app locally. |
| Build | Produce the Vercel-deployable production build. |
| Typecheck | Run TypeScript checks. |
| Lint and format | Check style and formatting, with separate mutating fix commands. |
| Unit tests | Run fast unit tests. |
| End-to-end tests | Run Playwright scenarios against the app. |
| Aggregate check | Run all required non-mutating checks. |

### Exit-code baseline

Repository-owned CLIs and scripts that expose explicit process status MUST use this baseline unless a narrower tool's convention is documented:

| Code | Meaning |
|---|---|
| `0` | success |
| `1` | internal bug or unexpected tool failure |
| `2` | usage error or invalid command invocation |
| `3` | precondition failure such as missing environment, missing dependency, or invalid project state |

### GitHub CI and pull request discipline

GitHub CI MUST run the aggregate check for pull requests before merge. Pull requests SHOULD also validate the Vercel build path. Release or production-promotion workflows MUST be explicit and MUST NOT rely on undocumented local state.

### Local memory guardrails

Repository automation and agent workflows MUST NOT persist private local memories in hidden tool state. If agent-facing local notes are needed, the repository MUST add `.ai/*.md` files and an `AGENTS.md` index. Hooks or checks SHOULD guard against persisting private local memories in unsupported locations once those conventions are introduced.

## Constraints

### TypeScript quality gates

TypeScript MUST run in strict mode. Linting and formatting MUST be enforced with TypeScript-native tools selected by the implementation. The linter configuration SHOULD include rules that catch unused code, unsafe promises, accidental `any`, import disorder, unreachable code, and test-only leakage into production bundles.

### Test coverage expectations

Coverage thresholds MUST be explicit before the first non-trivial implementation merge. The project SHOULD aim for high line and branch coverage on first-party logic, with stricter expectations for pure data transforms, answer-grounding logic, and MCP contracts than for framework glue.

### Fuzzing and property checks

Pure parsing, normalization, search, filtering, citation, and grounding modules SHOULD have property-based or fuzz-style tests when the input space is broader than a few fixed examples. These tests MUST run without network access.

### Hooks

Local hooks SHOULD run fast checks before commit and the aggregate check before push when practical. Hooks MUST be reproducible from committed configuration.

### Vercel environment discipline

Environment variables MUST be documented by name, purpose, environment class, and whether they are required for local, preview, or production use. Production secrets MUST be stored in Vercel or another managed secret store, never in the repository.

### Dependency discipline

Runtime dependencies MUST be justified by product behavior. Development dependencies MUST support the standalone TypeScript toolchain per `constraints.md` §"Standalone boundary".

## Scenarios

### Scenario: Scenario coverage gate protects acceptance behavior

Given a scenario is added to `SPECIFICATION/scenarios.md`

When the implementation claims that scenario is complete

Then a Playwright or integration test maps to that scenario before merge

### Scenario: Aggregate check is the single local quality gate

Given a contributor has installed the documented toolchain

When they run the aggregate check command

Then typechecking, linting, formatting, tests, and scenario coverage checks run through one documented entry point

### Scenario: Preview deployment validates a pull request

Given a pull request changes product behavior

When CI and Vercel preview checks run

Then the aggregate check passes and the preview deployment renders the changed resume app before merge
