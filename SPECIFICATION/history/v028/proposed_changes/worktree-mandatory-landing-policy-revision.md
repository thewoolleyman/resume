---
proposal: worktree-mandatory-landing-policy.md
decision: accept
revised_at: 2026-07-10T03:35:10Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

Owner directs adopting the livespec fleet's worktree-mandatory landing model. Reverses the prior direct-to-master sanction in non-functional-requirements.md (§"Release and Vercel promotion discipline", §"Pull request landing automation"): every change MUST be authored/committed in a secondary worktree and land via PR auto-merge or a worktree fast-forward push; enforced by a committed primary-checkout commit-refuse hook plus standalone Claude Code agent-session guards (§"Hooks"), with a matching enforcement scenario. Prompted by a session that left uncommitted work in the shared primary checkout, which the prior policy permitted.

## Resulting Changes

- non-functional-requirements.md
