#!/usr/bin/env bun
// background-gate-guard — Claude Code PreToolUse hook (Bash).
//
// Standalone TypeScript port of the fleet's pretooluse_background_guard, per
// SPECIFICATION/non-functional-requirements.md §"Hooks" and constraints.md
// §"Standalone boundary". Denies any Bash call that combines
// `run_in_background` with a GATE or LANDING command.
//
// Rationale: backgrounding a long gate command (`bun run check`, the commit
// hooks, `git push`, a worktree land) and then ending the turn "to wait for
// the notification" strands the work — fatal in a one-shot sub-agent. Gate and
// landing commands have no legitimate background use; they belong in the
// FOREGROUND. Legitimate background use of non-gate commands is untouched.
//
// The deny fires only on the conjunction (run_in_background AND a gate
// command). Fail-open on any parse error. Exit 0 always.
//
// Wire-up (.claude/settings.json): a PreToolUse hook with matcher "Bash" whose
// command is `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/background-gate-guard.ts"`.

const GATE_PATTERNS: RegExp[] = [
  /\bbun\s+run\s+check\b/, // the aggregate check
  /\bbun\s+\S*scripts\/check/, // any check-*.ts gate script
  /\bbun\s+run\s+tdd-commit\b/, // TDD land helper
  /\bbun\s+\S*scripts\/tdd-commit/,
  /\bgit\s+push\b/, // landing / push
  /\bgit\s+commit\b/, // commits belong in the foreground
];

const REASON =
  "Do NOT background a gate or landing command. `run_in_background` combined " +
  "with `bun run check`, a check-*/tdd-commit script, `git commit`, or " +
  "`git push` strands the work: the turn ends before the gate finishes and " +
  "the commit/land is never completed. Run it in the FOREGROUND and wait for " +
  "it to finish — the default Bash timeout is sized for these gates.";

export function isGateCommand(command: string): boolean {
  return GATE_PATTERNS.some((p) => p.test(command));
}

function deny(command: string): void {
  const payload = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        `BLOCKED by background-gate-guard.ts\n\n${REASON}\n\n` +
        `Command: ${command}\n\n` +
        "Re-run the SAME command in the foreground (omit run_in_background).",
    },
  };
  process.stdout.write(JSON.stringify(payload));
  process.exit(0);
}

if (import.meta.main) {
  try {
    const raw = await Bun.stdin.text();
    if (raw.trim().length === 0) {
      process.exit(0);
    }
    const data = JSON.parse(raw) as {
      tool_name?: string;
      tool_input?: { command?: string; run_in_background?: boolean };
    };
    if (data.tool_name !== "Bash") {
      process.exit(0);
    }
    const command = data.tool_input?.command ?? "";
    const background = data.tool_input?.run_in_background === true;
    if (background && command.length > 0 && isGateCommand(command)) {
      deny(command);
    }
    process.exit(0);
  } catch {
    process.exit(0); // fail open
  }
}
