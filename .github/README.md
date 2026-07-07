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

### Required secrets (maintainer-provisioned)

| Secret | Purpose |
| --- | --- |
| `APP_ID` | The GitHub App id of the maintainer-created automation App (needs `pull_requests: write` + `contents: write` permissions, installed on this repository). |
| `APP_PRIVATE_KEY` | A private key generated for that App. |

Until both secrets exist, the workflow emits an actionable notice and
does NOT enable auto-merge — the pull-request landing automation is not
claimed operational before the maintainer provisions them.

## Expected landing sequence

branch → open PR → auto-enable-merge workflow → required `check` (and,
later, Vercel) statuses → GitHub rebase auto-merge → `master` advances
linearly → delete the remote branch (automatic via
delete-branch-on-merge), clean up the local branch, refresh `master`.
