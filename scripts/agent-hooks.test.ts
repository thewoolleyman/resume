// Subprocess smoke tests for the standalone Claude Code agent-session hook
// scripts wired in .claude/settings.json, per
// SPECIFICATION/non-functional-requirements.md §"Hooks". The hook scripts live
// under .claude/hooks/ (Bun-executed, outside any tsconfig, eslint-ignored), so
// they are validated end-to-end here — spawned with real hook-input JSON on
// stdin, asserting the allow/deny/warn contract — rather than by unit import.

import { describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

describe("ensure-plugins", () => {
  // Plan-only mode, so the assertions never invoke the real plugin CLI.
  function plan(projectDir: string): { code: number | null; lines: string[] } {
    const run = Bun.spawnSync({
      cmd: ["bun", join(hooksDir, "ensure-plugins.ts"), "--print-plan"],
      cwd: repoRoot,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    });
    return {
      code: run.exitCode,
      lines: run.stdout.toString().trim().split("\n").filter(Boolean),
    };
  }

  function projectWithSettings(name: string, settings: unknown): string {
    const dir = join(tmpdir(), `ensure-plugins-${name}-${String(process.pid)}`);
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(
      join(dir, ".claude", "settings.json"),
      typeof settings === "string" ? settings : JSON.stringify(settings),
    );
    return dir;
  }

  const declared = {
    extraKnownMarketplaces: {
      livespec: {
        source: {
          source: "github",
          repo: "thewoolleyman/livespec",
          ref: "v0.7.3",
        },
      },
      "livespec-overseer": {
        source: {
          source: "github",
          repo: "thewoolleyman/livespec-overseer",
          ref: "v0.12.2",
        },
      },
    },
    enabledPlugins: {
      "livespec@livespec": true,
      "livespec-overseer@livespec-overseer": true,
    },
  };

  test("plans marketplace add AND install, not update alone", () => {
    // The defect this hook exists to fix: `plugin update` on a plugin that was
    // never installed does nothing, so an update-only provisioner can never
    // provision a newly declared plugin.
    const dir = projectWithSettings("declared", declared);
    try {
      const { code, lines } = plan(dir);
      expect(code).toBe(0);
      expect(lines).toContain(
        "claude plugin marketplace add thewoolleyman/livespec-overseer@v0.12.2",
      );
      expect(lines).toContain(
        "claude plugin install livespec-overseer@livespec-overseer -s project",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("refreshes the catalogs first", () => {
    const dir = projectWithSettings("order", declared);
    try {
      expect(plan(dir).lines[0]).toBe("claude plugin marketplace update");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("derives every plugin from settings rather than a literal list", () => {
    // A hard-coded list silently omits whatever was declared without a paired
    // hook edit. Enabling another plugin must need no change to the hook.
    const dir = projectWithSettings("derived", {
      extraKnownMarketplaces: {
        "brand-new": {
          source: { source: "github", repo: "owner/brand-new", ref: "v9.9.9" },
        },
      },
      enabledPlugins: { "brand-new@brand-new": true },
    });
    try {
      const { lines } = plan(dir);
      expect(lines).toContain(
        "claude plugin marketplace add owner/brand-new@v9.9.9",
      );
      expect(lines).toContain(
        "claude plugin install brand-new@brand-new -s project",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("does not install a plugin whose enablement is false", () => {
    const dir = projectWithSettings("disabled", {
      ...declared,
      enabledPlugins: { "livespec-overseer@livespec-overseer": false },
    });
    try {
      const { lines } = plan(dir);
      expect(lines.some((line) => line.includes("plugin install"))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("skips a marketplace entry with no github repo and ref", () => {
    // `ref` lives under the entry's nested `source` object; a top-level `ref`
    // is not the fleet shape and must not produce a malformed command.
    const dir = projectWithSettings("skips", {
      extraKnownMarketplaces: {
        local: { source: { source: "directory", path: "/tmp/x" } },
        refless: { source: { source: "github", repo: "owner/repo" } },
        toplevel: { source: { source: "github", repo: "owner/r2" }, ref: "v1" },
      },
      enabledPlugins: {},
    });
    try {
      expect(plan(dir).lines).toEqual(["claude plugin marketplace update"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("exits 0 on malformed settings (never wedges session start)", () => {
    const dir = projectWithSettings("malformed", "not json");
    try {
      const { code, lines } = plan(dir);
      expect(code).toBe(0);
      expect(lines).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("exits 0 when the project has no settings file", () => {
    const dir = join(tmpdir(), `ensure-plugins-absent-${String(process.pid)}`);
    mkdirSync(dir, { recursive: true });
    try {
      expect(plan(dir).code).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("provisions every plugin this project actually declares", () => {
    // Asserted against the committed settings file, so a plugin declared here
    // without provisioning support cannot pass unnoticed.
    const { code, lines } = plan(repoRoot);
    expect(code).toBe(0);
    const settings = JSON.parse(
      readFileSync(join(repoRoot, ".claude", "settings.json"), "utf8"),
    ) as { enabledPlugins?: Record<string, unknown> };
    for (const [name, enabled] of Object.entries(
      settings.enabledPlugins ?? {},
    )) {
      if (enabled === true) {
        expect(lines).toContain(`claude plugin install ${name} -s project`);
      }
    }
  });
});
