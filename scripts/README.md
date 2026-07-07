# scripts/ — repository harness

Repository harness/tooling per
`SPECIFICATION/non-functional-requirements.md` §"Mechanically enforced
Red -> Green commit protocol": nothing here is first-party product
source under `src/**`. Harness code is covered by its own tests
(`bun run test:harness`, Bun's built-in runner over `scripts/**/*.test.ts`).

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
- **Dependencies** (none yet) must use exact versions — no `^`/`~`
  ranges — with `bun.lock` committed once dependencies exist. Enforced
  by `scripts/package-scripts.test.ts`.

## Bootstrap

`bun run bootstrap` installs pinned dependencies (`bun install`) and
the committed hooks (`install-hooks.ts` points `core.hooksPath` at
`.githooks/`). Hook files land additively with their slices; see
`.githooks/README.md`.
