---
topic: worktree-mandatory-landing-policy
author: claude-opus-4-8
created_at: 2026-07-10T03:28:59Z
---

## Proposal: worktree-mandatory-landing-policy

### Target specification files

- SPECIFICATION/non-functional-requirements.md

### Summary

Reverse the change-landing policy in non-functional-requirements.md from 'direct owner commits to master are a sanctioned path / the owner's standing preference' to worktree-mandatory: every repository change MUST be authored and committed in a dedicated secondary git worktree on a feature branch, and MUST NOT be committed in the primary checkout. Landing remains linear (rebase auto-merge or fast-forward, no merge commits) and ends with worktree/branch cleanup. Add a committed primary-checkout commit-refuse enforcement requirement plus agent-session guard hooks, both verified by the aggregate check.

### Motivation

The owner directs that resume adopt the livespec fleet's worktree-mandatory model so no session can author changes in, or leave stray state on, the shared primary checkout. This was prompted by a session that ran a spec-side operation directly in the primary checkout on master and left an uncommitted proposed-change file polluting the working tree — behavior the current 'direct-to-master sanctioned' policy explicitly permits. The reversal removes that permission and backs it with committed enforcement so the discipline does not depend on agent judgment.

### Proposed Changes

In non-functional-requirements.md §"Pull request landing automation" and the surrounding change-landing prose: (1) REMOVE the sentences stating that 'Direct owner commits to `master` are a sanctioned path — the repository owner's standing preference — not an emergency-only exception' and that 'Changes MAY reach `master` through direct owner commits'. (2) REPLACE them with: every repository change MUST be authored and committed in a dedicated secondary git worktree on a feature branch, created via `git worktree add -b <branch> "$HOME/.worktrees/<repo>/<branch>" master`; the primary checkout at the repository root MUST NOT be used to author or commit changes. (3) State that a change MUST land by either the pull-request path (branch → PR → required checks → rebase auto-merge → cleanup) OR a fast-forward of `master` from the worktree branch when review is not required, and MUST end by removing the worktree, deleting the branch, and refreshing `master`. Linear history (rebase/fast-forward, no merge commits) per §"Pull request landing automation" is UNCHANGED. (4) Add that a committed **primary-checkout commit-refuse** git hook MUST reject any commit whose repository git-dir equals its git-common-dir (i.e., a commit in the primary checkout), naming the worktree alternative, and that `bun run check` MUST verify the hook is installed. (5) In §"Hooks" (or an adjacent subsection), require committed Claude Code agent-session guards — a `PreToolUse` git-footgun guard, a background-gate guard, and a `SubagentStop` in-flight-worktree guard — plus a `.claude/CLAUDE.md` load path for `AGENTS.md`, all standalone per §"Standalone boundary" (no dependency on livespec fleet Python tooling). The realization of these requirements — the `.claude/` hooks, settings, symlink, and the `AGENTS.md` §"Commit and land automatically" rewrite — is implementation work landed after this revision; `AGENTS.md` is not under `SPECIFICATION/` and is updated directly to match.
