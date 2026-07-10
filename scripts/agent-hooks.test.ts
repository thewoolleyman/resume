// Subprocess smoke tests for the standalone Claude Code agent-session hook
// scripts wired in .claude/settings.json, per
// SPECIFICATION/non-functional-requirements.md §"Hooks". The hook scripts live
// under .claude/hooks/ (Bun-executed, outside any tsconfig, eslint-ignored), so
// they are validated end-to-end here — spawned with real hook-input JSON on
// stdin, asserting the allow/deny/warn contract — rather than by unit import.

import { describe, expect, test } from "bun:test";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const hooksDir = join(repoRoot, ".claude", "hooks");

interface DenyOutput {
  hookSpecificOutput?: { permissionDecision?: string };
}

function runHook(
  script: string,
  input: Record<string, unknown>,
): { code: number | null; stdout: string } {
  const run = Bun.spawnSync({
    cmd: ["bun", join(hooksDir, script)],
    stdin: new TextEncoder().encode(JSON.stringify(input)),
    cwd: repoRoot,
  });
  return { code: run.exitCode, stdout: run.stdout.toString() };
}

function bash(
  command: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return { tool_name: "Bash", tool_input: { command, ...extra } };
}

function decisionOf(stdout: string): string | undefined {
  return (JSON.parse(stdout) as DenyOutput).hookSpecificOutput
    ?.permissionDecision;
}

describe("footgun-guard", () => {
  test("denies git commit --no-verify", () => {
    const { code, stdout } = runHook(
      "footgun-guard.ts",
      bash('git commit --no-verify -m "x"'),
    );
    expect(code).toBe(0);
    expect(decisionOf(stdout)).toBe("deny");
  });

  test("allows a normal commit (no output)", () => {
    const { stdout } = runHook("footgun-guard.ts", bash('git commit -m "ok"'));
    expect(stdout.trim()).toBe("");
  });

  test("does not block --no-verify appearing as echo DATA", () => {
    const { stdout } = runHook(
      "footgun-guard.ts",
      bash('echo "git commit --no-verify"'),
    );
    expect(stdout.trim()).toBe("");
  });

  test("denies git config core.bare true", () => {
    const { stdout } = runHook(
      "footgun-guard.ts",
      bash("git config core.bare true"),
    );
    expect(decisionOf(stdout)).toBe("deny");
  });

  test("allows git config --get core.bare (a read)", () => {
    const { stdout } = runHook(
      "footgun-guard.ts",
      bash("git config --get core.bare"),
    );
    expect(stdout.trim()).toBe("");
  });

  test("denies a Bash write into the Claude memory store", () => {
    const { stdout } = runHook(
      "footgun-guard.ts",
      bash("echo x >> ~/.claude/projects/foo/memory/bar.md"),
    );
    expect(decisionOf(stdout)).toBe("deny");
  });

  test("ignores non-Bash tools", () => {
    const { stdout } = runHook("footgun-guard.ts", {
      tool_name: "Read",
      tool_input: { file_path: "x" },
    });
    expect(stdout.trim()).toBe("");
  });
});

describe("background-gate-guard", () => {
  test("denies backgrounding `bun run check`", () => {
    const { stdout } = runHook(
      "background-gate-guard.ts",
      bash("bun run check", { run_in_background: true }),
    );
    expect(decisionOf(stdout)).toBe("deny");
  });

  test("denies backgrounding a git push", () => {
    const { stdout } = runHook(
      "background-gate-guard.ts",
      bash("git push origin HEAD:master", { run_in_background: true }),
    );
    expect(decisionOf(stdout)).toBe("deny");
  });

  test("allows `bun run check` in the foreground", () => {
    const { stdout } = runHook(
      "background-gate-guard.ts",
      bash("bun run check", { run_in_background: false }),
    );
    expect(stdout.trim()).toBe("");
  });

  test("allows backgrounding a non-gate command", () => {
    const { stdout } = runHook(
      "background-gate-guard.ts",
      bash("sleep 60", { run_in_background: true }),
    );
    expect(stdout.trim()).toBe("");
  });
});

describe("subagent-stop-guard", () => {
  test("allows when stop_hook_active is set (no loop)", () => {
    const run = Bun.spawnSync({
      cmd: ["bun", join(hooksDir, "subagent-stop-guard.ts")],
      stdin: new TextEncoder().encode(
        JSON.stringify({ stop_hook_active: true, transcript_path: "/nope" }),
      ),
      cwd: repoRoot,
    });
    expect(run.exitCode).toBe(0);
    expect(run.stdout.toString().trim()).toBe("");
  });

  test("allows when the transcript is missing", () => {
    const run = Bun.spawnSync({
      cmd: ["bun", join(hooksDir, "subagent-stop-guard.ts")],
      stdin: new TextEncoder().encode(
        JSON.stringify({ transcript_path: "/nonexistent/transcript.jsonl" }),
      ),
      cwd: repoRoot,
    });
    expect(run.exitCode).toBe(0);
    expect(run.stdout.toString().trim()).toBe("");
  });

  test("ignores an agent that never created a .worktrees/ worktree", () => {
    // A transcript whose only git worktree reference is a non-fleet path
    // yields no candidates, so the turn-end is allowed.
    const transcript =
      JSON.stringify({
        type: "assistant",
        message: {
          content: [
            {
              type: "tool_use",
              input: { command: "git worktree list" },
            },
          ],
        },
      }) + "\n";
    const tmp = join(tmpdir(), "agent-hooks-test-transcript.jsonl");
    writeFileSync(tmp, transcript);
    const run = Bun.spawnSync({
      cmd: ["bun", join(hooksDir, "subagent-stop-guard.ts")],
      stdin: new TextEncoder().encode(JSON.stringify({ transcript_path: tmp })),
      cwd: repoRoot,
    });
    rmSync(tmp, { force: true });
    expect(run.exitCode).toBe(0);
    expect(run.stdout.toString().trim()).toBe("");
  });
});

describe("session-plugin-freshness", () => {
  test("runs and exits 0 (never wedges session start)", () => {
    const run = Bun.spawnSync({
      cmd: ["bun", join(hooksDir, "session-plugin-freshness.ts")],
      stdin: new TextEncoder().encode("{}"),
      cwd: repoRoot,
    });
    expect(run.exitCode).toBe(0);
    const out = run.stdout.toString().trim();
    if (out.length > 0) {
      // When it warns, it emits valid SessionStart additionalContext JSON.
      const parsed = JSON.parse(out) as {
        hookSpecificOutput?: { hookEventName?: string };
      };
      expect(parsed.hookSpecificOutput?.hookEventName).toBe("SessionStart");
    }
  });
});
