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
(`typecheck`, `lint`, `format:check`), fail-closes on `src/**` product
source appearing before the guardrails are complete, and prints every
not-yet-provisioned gate family with the work item that provisions it.
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
