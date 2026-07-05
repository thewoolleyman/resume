---
proposal: pr-landing-automation.md
decision: modify
revised_at: 2026-07-05T01:17:45Z
author_human: thewoolleyman <chad@thewoolleyman.com>
author_llm: claude-opus-4-8
---

## Decision and Rationale

The user chose modify to reconcile this proposal with their standing direct-to-master auto-commit preference. The PR-landing automation is accepted as the target review discipline (rebase-merge-only, linear history, branch protection, the auto-enable-merge workflow, no auto-update-branches, plus two contributor scenarios and the landing diagram), but reframed so it does not contradict how the owner works today or declare the current repo non-compliant before the CI/workflow exists.

## Modifications

Relative to the filed proposal: (1) the opening rule changed from "every tracked-file change MUST land through a pull request unless the user explicitly asks for an emergency direct-to-master operation" to "changes MAY land by the owner committing directly to master OR through a pull request; direct owner commits are a sanctioned path, not an emergency-only exception"; (2) branch protection was downgraded from MUST-configured to SHOULD-configured, keeping the admin-enforcement and non-strict requirements as MUST once configured, and the auto-enable-merge.yml requirement was scoped to "when the automated pull-request path is provisioned" so the spec describes target state without declaring the current repo non-compliant; (3) the aggregate-check verification was scoped to "when the automated path is claimed operational." The rebase-merge-only/linear-history settings, the GitHub App token requirement, the no-auto-update-branches rule, the landing diagram, and the two contributor scenarios (Pull request lands automatically after required checks pass; Red pull request cannot land) landed as filed.

## Resulting Changes

- non-functional-requirements.md
