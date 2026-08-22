# GitHub CI and pull-request automation

Repository automation per `SPECIFICATION/non-functional-requirements.md`
§"GitHub CI and pull request discipline" and §"Pull request landing
automation". The shape of everything documented here is verified locally
by `scripts/check-ci.ts` inside `bun run check`; the live GitHub settings
can additionally be verified with `bun scripts/check-ci.ts --live` (or by
running the aggregate check with `CHECK_LIVE_GITHUB=1`) whenever `gh`
credentials are available.

## Required status checks

- **`check`** — the aggregate-check status, produced by the `check` job in
  `workflows/check.yml` (it runs `bun run check` on every pull request
  targeting `master` and on every push to `master`). Branch protection
  MUST require this status before a pull request merges; it is the status
  name auto-merge waits for.
- **Vercel preview** — not yet provisioned. When the Vercel GitHub
  integration is activated (a later slice / plan/mvp), its status-check
  name must be documented here and added to branch protection.

## Merge methods and linear history

- Rebase merge is the ONLY allowed pull-request merge method: squash
  merge and merge commits are disabled in the repository settings, so
  every commit keeps its Conventional Commit subject and `master` stays
  linear.
- `master` requires linear history. This is enforced by the
  `linear-history` repository ruleset with **no bypass actors**, so it
  applies to administrators too, while still permitting the repository
  owner's direct pushes (a linear push violates no rule). Direct owner
  commits remain a sanctioned path — gated post-push by the on-push
  `check` run — and branch protection MUST NOT require a pull request
  for every change.

## Branch protection

Classic branch protection on `master` requires the `check` status
context with **strict mode NOT enabled** (`strict: false`):
with `gh pr merge --auto`, GitHub's require-branches-up-to-date setting
can update a behind PR by merging `master` into it, which violates
linear history. Rebase auto-merge already replays the PR on the current
`master` tip at merge time. `enforce_admins` stays off on the classic
rule so the owner's direct pushes are not blocked by the
required-status rule; administrators remain bound to linear history via
the ruleset above.

No auto-update-branches workflow (or equivalent `master`-into-branch
merge mechanism) may exist; behind pull requests are handled by rebase
auto-merge at merge time.

## Auto-merge (workflows/auto-enable-merge.yml)

For eligible pull requests — non-draft, not labeled `do-not-merge`,
opened by the repository owner or an explicitly allowlisted automation
identity — the workflow enables rebase auto-merge
(`gh pr merge "$PR" --repo "$REPO" --auto --rebase`), and GitHub merges
once the required checks pass. Apply the `do-not-merge` label to park a
pull request; removing the label (the `unlabeled` trigger) re-enables
auto-merge.

The workflow authenticates with a short-lived GitHub App installation
token minted at runtime by `actions/create-github-app-token`, because
`github-actions[bot]`'s `GITHUB_TOKEN` does not reliably have permission
to enable auto-merge.

**Operational — proven 2026-07-08:** PR #2 was armed by
`app/resume-pr-bot` seconds after opening and rebase-merged
automatically on a green `check`
(merge `1804aa4b7b2dcd75aa7cc834ceeecf1f8a87be91`), with the remote
branch auto-deleted.

### Required secrets (provisioned 2026-07-08; re-pointed 2026-08-22)

| Secret | Purpose |
| --- | --- |
| `APP_ID` | The GitHub App id of the maintainer's shared automation App `thewoolleyman-factory-bot` (app id `3668528`; `pull_requests: write` + `contents: write`). |
| `APP_PRIVATE_KEY` | A private key generated for that App. |

Both secrets named the per-repository App `resume-pr-bot` (app id `4243167`,
installation `145115216`) until 2026-08-22T03:42:48Z, when they were re-pointed
to the shared App and 4243167 was deleted. Run 32549501155 minted a token as the
new App at 03:43:43Z, which is the proof the cutover took.

Deleting an App reassigns its already-open pull requests to GitHub's `ghost`
user, so the 19 pull requests open from `resume-pr-bot` at cutover no longer
match any auto-merge allowlist arm and need a human merge or a reopen under a
live identity.

Both repository secrets are set. The canonical copy of these
credentials lives in the maintainer's `resume` 1Password Environment;
GitHub Actions reads them ONLY from the repository secrets above, never
from the wrapper.

### Local secret injection (NFR §"Local secret injection")

Repository-local commands that need secrets — the live GitHub settings
verification (`CHECK_LIVE_GITHUB=1` with `bun run check`, or
`bun scripts/check-ci.ts --live`) and future Vercel/AI credentials —
inject them through the `with-resume-env.sh` wrapper, which loads the
`resume` 1Password Environment via `op run`. The wrapper contains no
secret values and is a generated artifact of the external
[1password-env-wrapper](https://github.com/thewoolleyman/1password-env-wrapper)
factory — never hand-edit it; re-render via the factory. Secrets are
never passed as command-line arguments and never committed.

**Current state:** the wrapper is committed at the repository root
(`with-resume-env.sh`) — the generated factory artifact for
`IDENTIFIER='resume'`, injecting the `resume` 1Password Environment
(id `fj6btfanxkhmqdrvrtjp2tj5qm`) via `op run`. It carries no secret
values; the service-account token lives in the host secure store
(systemd-creds on Linux). `scripts/check-ci.ts` verifies this
documentation and the rendered artifact's shape and secret-freedom.

**Newline handling (important).** `op run` delivers a multiline secret
such as `GITHUB_APP_PRIVATE_KEY` **flattened to a single line** — the
newlines are stripped regardless of how the key is stored in the
Environment — so the raw injected value is NOT a loadable PEM
(`openssl` rejects it). Any consumer of the injected key MUST normalize
it first, reconstructing the PEM line structure, via
`scripts/normalize-pem.ts` (`normalizePem`) — the standalone realization
of the livespec `normalize_pem` lesson. GitHub Actions is unaffected:
the auto-merge workflow reads the `APP_PRIVATE_KEY` Actions secret
through `actions/create-github-app-token`, which normalizes internally.
The default `bun run check` needs no secrets; the live GitHub check
authenticates through local `gh` credentials.

## Expected landing sequence

branch → open PR → auto-enable-merge workflow → required `check` (and,
later, Vercel) statuses → GitHub rebase auto-merge → `master` advances
linearly → delete the remote branch (automatic via
delete-branch-on-merge), clean up the local branch, refresh `master`.
