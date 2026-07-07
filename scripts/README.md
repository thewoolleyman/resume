# scripts/ — repository harness

Repository harness/tooling per
`SPECIFICATION/non-functional-requirements.md` §"Mechanically enforced
Red -> Green commit protocol": nothing here is first-party product
source under `src/**`. Harness code is covered by its own tests
(`bun run test:harness`, Bun's built-in runner over `scripts/**/*.test.ts`).

## Aggregate check (`bun run check`)

`check.ts` is the single non-mutating quality gate per
§"Aggregate command". Gates activate additively: it verifies the
package-script surface (required names, bootstrap hook install, exact
version pins), runs the harness tests, verifies the toolchain
configuration baseline (the five required TypeScript strictness flags,
the lint rule families, and the format config — failing by name when
any is dropped), runs the toolchain gates through their named scripts
(`typecheck`, `lint`, `format:check`), validates TDD evidence over
`origin/master..HEAD`, runs the local memory guardrail
(`check:memory`) and the discipline-adoption inventory verification,
fail-closes on `src/**` product source appearing before the guardrails
are complete, and prints every not-yet-provisioned gate family with
the work item that provisions it.
Exit codes: `0` pass, `1` gate failure, `2` usage error,
`3` precondition failure (documented narrower convention: a failing
gate is `1`, not an internal bug).

Internal test guards: `CHECK_SKIP_HARNESS_TESTS=1` skips the
harness-test gate and `CHECK_SKIP_TOOLCHAIN_RUNNERS=1` skips the
runner gate; the harness tests set both on nested invocations to avoid
recursive `bun test scripts` runs, and exercise the skipped commands
directly instead.

## Toolchain gates

- **Typecheck** — `tsc --noEmit` plus `svelte-check --no-tsconfig
  --fail-on-warnings`. Until the SvelteKit app scaffold lands there are
  no `.svelte` files or generated `$types`, so svelte-check runs in
  svelte-file-only mode; the app scaffold slice replaces this with
  tsconfig-aware checking over the generated SvelteKit config.
- **Lint** — type-aware ESLint at the `typescript-eslint`
  strict-type-checked baseline, Svelte-aware linting with
  `svelte/valid-compile` surfacing compiler (incl. accessibility)
  diagnostics as errors, `perfectionist` import-order rules, an
  import-boundary placeholder (`no-restricted-imports`), and
  `eslint-config-prettier` compatibility. Zero warnings:
  `--max-warnings 0`.
- **Format** — Prettier with `prettier-plugin-svelte`. Markdown is
  excluded (`.prettierignore`) because specs and plans are governed
  prose whose diffs must stay stable.

## Red -> Green TDD commit gate

`.githooks/commit-msg` (installed by `bootstrap`) runs
`tdd-commit-msg-hook.ts`, the content-triggered gate from
§"Mechanically enforced Red -> Green commit protocol": the staged
buckets (first-party product source under `src/**` vs test files)
plus HEAD trailer state select the Red, Green, or Suite-Green leg —
never an intent marker or subject prefix. Red stages exactly one
failing anchor test alone (a real assertion failure; import errors are
rejected) and records checksummed `TDD-Red-*` trailers; Green amends
the implementation in, re-verifies the anchor byte-for-byte, re-runs
it, and records `TDD-Green-*`; Suite-Green runs the full provisioned
suite against the staged tree (zero-test runs reject) and records
`TDD-Suite-Green-*`. `tdd-range-check.ts` re-validates
`origin/master..HEAD` inside `bun run check` so rebases, squashes, and
`--no-verify` commits cannot launder product source past the hook; an
unresolvable base fails actionably. `bun run tdd-commit red-green
--anchor <test> --message "<subject>"` mechanizes
stage-anchor-alone -> commit -> stage-implementation -> amend;
`bun run tdd-commit suite-green --message "<subject>"` covers
refactors, chores, and passing test-only cleanups. Anchor runner
dispatch: Playwright for `e2e/**`, Vitest once it joins the toolchain,
Bun's built-in runner until then (the documented interim runner).

## Local memory guardrail (`check:memory`)

`check-memory.ts` enforces §"Local memory guardrails": prohibited
private-memory / hidden tool-state paths (`.claude/**`, `.codex/**`,
`.cursor/**`, `.continue/**`, `.aider*`, and — as the documented
mechanical realization of hidden memory databases, transcripts, and
tool caches — default-deny for any other hidden path not documented as
ordinary tool configuration), `.ai/` entries that are not flat
`.ai/*.md` notes, unindexed notes, and dangling `AGENTS.md`
references — a note is indexed only by a purpose-bearing entry under
the AGENTS.md "Agent-facing notes index", never by a prose mention.
The policy and its narrow exceptions (`.claude/settings.json`,
shareable `.idea` project configuration, …) live in
`AGENTS.md` §"Local memory guardrail policy";
the script's allowlist mirrors it. Enforced twice per the spec:
`.githooks/pre-commit` runs it with `--staged` (index paths plus the
staged `AGENTS.md`), and the aggregate check runs `bun run
check:memory` over the tracked tree (git index when a `.git` exists, a
filesystem walk otherwise — e.g. the hook's staged-tree checkout).
Self-contained by design so the hook and fixtures can run it
standalone. Exit codes: `0` clean, `1` violations, `2` usage, `3`
precondition (`--staged` outside a git repository).

## Discipline-adoption inventory gate

`check-discipline-inventory.ts` verifies `.ai/discipline-adoption.md`
per §"Discipline adoption inventory": the required columns, every
seed-listed baseline row, allowed dispositions and enforcement
classes, resolvable citations for gate-/process-enforced rows (a
backticked `bun run <script>` must be a real non-stub script, a
backticked path must exist), a "none"-coverage plus explicit
not-enforced disclaimer for documented-only rows, reason + revisit
conditions for deferred/rejected rows, a gate-enforced TDD row citing
the commit-msg hook, and an ecosystem row citing the §"Livespec
ecosystem tooling adoption" enumeration. Runs in-process inside
`check.ts` and standalone via
`bun scripts/check-discipline-inventory.ts`. A tree without the
inventory is unprovisioned unless it already carries `src/**` product
source, which fail-closes.

## GitHub CI and pull-request automation gate

`check-ci.ts` verifies §"GitHub CI and pull request discipline" and
§"Pull request landing automation" locally:
`.github/workflows/check.yml` (pull_request→master + push→master,
full-history checkout for the TDD range base, pinned Bun via
`bun-version-file`, `--frozen-lockfile` install, `bun run check`, and
named-script-only delegation), `.github/workflows/auto-enable-merge.yml`
(the five PR trigger types, draft and `do-not-merge` skips,
owner/allowlist eligibility, GitHub App token mint via
`secrets.APP_ID`/`secrets.APP_PRIVATE_KEY`, `gh pr merge --auto
--rebase`), the absence of any auto-update-branches mechanism, and the
settings documentation in `.github/README.md`. Runs in-process inside
`check.ts`; `CHECK_LIVE_GITHUB=1` (or `bun scripts/check-ci.ts --live`)
additionally verifies the real GitHub settings via `gh` — merge
methods, auto-merge, the required `check` status (non-strict), and the
no-bypass linear-history ruleset. A tree without `.github/workflows/`
is unprovisioned unless it already carries `src/**`, which fail-closes.

## Result/ROP enforcement gate (`check:result`)

`check-result.ts` enforces §"Result and railway-oriented programming
discipline" with standalone TypeScript compiler-API AST checks over
first-party `src/**` (armed-but-vacuous until product source lands;
each check activates with the first product commit): core modules
(`src/data|domain|search|grounding|mcp-contracts`) must export
Result-returning functions, boundary modules (`src/adapters|server|api`)
must export `AsyncResult`/`Promise<Result<…>>`, Result return values
may not be ignored (bare/void-discarded statements and never-read
variable bindings both fail), catch clauses outside the approved
boundary adapters must rethrow on their own execution path (a throw
inside a nested function does not count), `DomainError` is never
thrown, UI modules
(`src/routes|components`) must not render raw `Error`
`.message`/`.stack` payloads, and `src/**` relative imports must not
resolve outside the repository (standalone import boundary). It also
verifies the type-aware ESLint result rules
(`@typescript-eslint/no-floating-promises`,
`@typescript-eslint/switch-exhaustiveness-check`) stay effectively
enabled via `eslint --print-config`. The documented `Result` /
`DomainError` shape lives in the NFR §"Result and railway-oriented
programming discipline"; the layer split is repeated in the script
header.

## Package-script surface

`package.json` names every script required by §"Package script
categories". Scripts whose gate or toolchain artifact has not landed
yet delegate to `not-yet-provisioned.ts`, which exits `3` (the
§"Exit-code baseline" precondition-failure code) with a message naming
the guardrail work item that provisions it — a not-yet-provisioned
script can never be mistaken for a passing gate. Each guardrail slice
replaces its stub with the real command, keeping provisioning additive
per §"Guardrail provisioning boundary".

## Version pinning

- **Bun** is pinned in `package.json` `engines.bun` (exact version).
  Bun does not hard-enforce `engines`; the pin is the documented
  version-selection record required by §"Contributor toolchain", and
  the aggregate check (work item `li-w6mvog`) verifies it.
- **Dependencies** must use exact versions — the entire spec must be
  one version (prerelease/build metadata allowed), so `^`/`~`, ranges,
  and dist-tags all fail — with `bun.lock` committed. Enforced by the
  aggregate check and `scripts/package-scripts.test.ts`.

## Bootstrap

`bun run bootstrap` installs pinned dependencies (`bun install`) and
the committed hooks (`install-hooks.ts` points `core.hooksPath` at
`.githooks/`). Hook files land additively with their slices; see
`.githooks/README.md`.
