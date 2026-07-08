---
topic: local-secret-injection-wrapper
author: claude-fable-5
created_at: 2026-07-08T02:02:48Z
---

## Proposal: Local secret injection via the committed 1Password environment wrapper

### Target specification files

- non-functional-requirements.md

### Summary

Add a Contracts subsection "Local secret injection" to non-functional-requirements.md naming the committed 1Password environment wrapper with-resume-env.sh as the documented injection mechanism for repository-local secret-needing commands (the live GitHub settings verification today; Vercel or AI-provider credentials later), plus a contributor-workflow scenario in this file's own Scenarios section. The subsection pins the security properties: no secret values in the wrapper or any committed file, no secrets on command-line arguments, the service-account token in the host platform secure store, the default aggregate check requiring no secrets, GitHub Actions consuming repository secrets rather than the wrapper, and the wrapper being a generated factory artifact whose committal creates no standalone-boundary dependency.

### Motivation

Maintainer-directed work item li-2o7eza makes the pull-request landing automation operational end-to-end using the standard 1Password env-wrapper pattern. The repository documentation and harness will document and verify wrapper usage for every secret-needing local command, and the NFR currently requires provisioning the APP_ID / APP_PRIVATE_KEY secrets (§"Pull request landing automation") without naming any local injection mechanism. Livespec governance requires non-functional changes to land in the accepted specification before implementation work relies on them, so the wrapper mechanism must be specified before docs and gates mandate it.

### Proposed Changes

Add to `non-functional-requirements.md` under `## Contracts`, immediately after §"Pull request landing automation", a new subsection `### Local secret injection`:

- Repository-local commands that need secrets — the live GitHub settings verification (`CHECK_LIVE_GITHUB=1` with `bun run check`, or `bun scripts/check-ci.ts --live`) and any future local command needing Vercel or AI-provider credentials — MUST receive those secrets from a managed secret store through the committed wrapper command `with-resume-env.sh` at the repository root, which injects the `resume` 1Password Environment via `op run`, or through a documented stricter equivalent recording the coverage it provides.
- The wrapper MUST NOT contain secret values. It MAY carry non-secret identifiers such as the 1Password Environment id and the wrapper identifier. The 1Password service-account token MUST live in the host platform secure store (a systemd-creds encrypted credential on Linux; the login Keychain on macOS) and MUST NOT be committed; secrets MUST NOT be passed as command-line arguments to repository commands. Bootstrap inputs for provisioning the wrapper MAY live in a gitignored `.env.local`.
- The default `bun run check` MUST NOT require secrets or the wrapper: secret-needing verification (such as the live GitHub settings check) MUST remain opt-in, so a checkout with no credentials still runs the full default gate set.
- The wrapper is a generated artifact rendered by the external `1password-env-wrapper` factory (canonical source `https://github.com/thewoolleyman/1password-env-wrapper`). It MUST NOT be hand-edited; changes MUST flow through the factory and re-rendering. Committing the rendered wrapper MUST NOT create a runtime, build, test, CI, or hook dependency on the factory checkout, preserving `constraints.md` §"Standalone boundary" — only re-rendering or re-installing the wrapper needs the factory.
- GitHub Actions workflows MUST receive their secrets from GitHub Actions repository secrets (for example `APP_ID` and `APP_PRIVATE_KEY` per §"Pull request landing automation"), not from the wrapper; the wrapper is the local-development and local-verification injection path. Production deployment secrets remain governed by §"Vercel environment discipline" and `contracts.md` §"Environment contract".
- Repository documentation — the `.github/README.md` secrets section and `scripts/README.md` — MUST document wrapper usage for every documented secret-needing repository command.

Add to `non-functional-requirements.md` `## Scenarios`:

`### Scenario: Secret-needing local commands inject secrets through the committed wrapper`

Given a repository-local command needs a secret, such as the live GitHub settings verification

When a contributor runs that command per the documented workflow

Then the documentation routes it through the committed `with-resume-env.sh` wrapper (or the documented stricter equivalent), no secret value appears in a committed file or on a command-line argument, and the default aggregate check still passes on a checkout with no secrets present.
