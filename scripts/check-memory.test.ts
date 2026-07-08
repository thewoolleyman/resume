// Harness test for the local memory guardrail (work item li-6b6u6m;
// plan/guardrail/research/findings.md slice 5).
//
// Pins SPECIFICATION/non-functional-requirements.md §"Local memory
// guardrails": prohibited private-memory / hidden tool-state paths
// (.claude/**, .codex/**, .cursor/**, .continue/**, .aider*, and — as the
// documented mechanical realization of hidden memory databases, transcripts,
// and tool caches — any hidden path not documented as ordinary tool
// configuration) are rejected; .ai/ holds only flat .ai/*.md notes, each
// indexed from AGENTS.md; AGENTS.md references to missing .ai notes fail.
// The guard is BOTH hook-enforced (.githooks/pre-commit, staged tree) and
// aggregate-enforced (`bun run check:memory` inside `bun run check`), so a
// bypassed or uninstalled hook is still caught.

import { afterAll, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const memoryScript = join(repoRoot, "scripts", "check-memory.ts");

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function sh(
  cwd: string,
  cmd: readonly string[],
): { exitCode: number | null; output: string } {
  const run = Bun.spawnSync({ cmd: [...cmd], cwd });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

function git(
  cwd: string,
  ...args: readonly string[]
): { exitCode: number | null; output: string } {
  return sh(cwd, ["git", ...args]);
}

function runMemory(
  root: string,
  ...flags: readonly string[]
): { exitCode: number | null; output: string } {
  return sh(root, ["bun", memoryScript, "--project-root", root, ...flags]);
}

// A clean tree fixture: an indexed .ai note plus one representative of each
// documented ordinary-tool-configuration allowlist family
// (AGENTS.md §"Local memory guardrail policy"). The .idea entries are the
// SHAREABLE JetBrains project-configuration forms only — workspace/local
// state is prohibited (watcher fix li-6tntj5).
function makeTree(): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-memory-fixture-"));
  fixtures.push(dir);
  writeFileSync(
    join(dir, "AGENTS.md"),
    "# AGENTS.md\n\n## Agent-facing notes index\n\n" +
      "- `.ai/decisions.md` — fixture note\n",
  );
  mkdirSync(join(dir, ".ai"), { recursive: true });
  writeFileSync(join(dir, ".ai", "decisions.md"), "# decisions\n");
  writeFileSync(join(dir, ".gitignore"), "node_modules/\n");
  mkdirSync(join(dir, ".idea", "inspectionProfiles"), { recursive: true });
  writeFileSync(join(dir, ".idea", "modules.xml"), "<project />\n");
  writeFileSync(join(dir, ".idea", "fixture.iml"), "<module />\n");
  writeFileSync(
    join(dir, ".idea", "inspectionProfiles", "Project_Default.xml"),
    "<profile />\n",
  );
  mkdirSync(join(dir, ".claude"), { recursive: true });
  writeFileSync(join(dir, ".claude", "settings.json"), "{}\n");
  // The beads work-item tenant store: ONLY these two committable pointer files
  // are tracked (ordinary orchestrator data, not private memory).
  mkdirSync(join(dir, ".beads"), { recursive: true });
  writeFileSync(join(dir, ".beads", "config.yaml"), "dolt.mode: server\n");
  writeFileSync(join(dir, ".beads", ".gitignore"), "metadata.json\n");
  return dir;
}

describe("local memory guardrail — tree mode (li-6b6u6m)", () => {
  test("passes a clean tree, allowing documented ordinary tool configuration", () => {
    const { exitCode } = runMemory(makeTree());
    expect(exitCode).toBe(0);
  });

  test("rejects .codex/** as a prohibited hidden tool-state path", () => {
    const dir = makeTree();
    mkdirSync(join(dir, ".codex"), { recursive: true });
    writeFileSync(join(dir, ".codex", "leak.md"), "memory\n");
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".codex/leak.md");
  });

  test("rejects .claude/** beyond the documented settings.json exception", () => {
    const dir = makeTree();
    writeFileSync(join(dir, ".claude", "memory.json"), "{}\n");
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".claude/memory.json");
  });

  test("rejects .cursor/** and .continue/**", () => {
    const dir = makeTree();
    mkdirSync(join(dir, ".cursor"), { recursive: true });
    writeFileSync(join(dir, ".cursor", "rules"), "state\n");
    mkdirSync(join(dir, ".continue"), { recursive: true });
    writeFileSync(join(dir, ".continue", "config.json"), "{}\n");
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".cursor/rules");
    expect(output).toContain(".continue/config.json");
  });

  test("rejects .aider* state files", () => {
    const dir = makeTree();
    writeFileSync(join(dir, ".aider.chat.history.md"), "chat\n");
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".aider.chat.history.md");
  });

  test("default-denies a hidden tool-state path outside the documented allowlist", () => {
    const dir = makeTree();
    mkdirSync(join(dir, ".some-agent-cache"), { recursive: true });
    writeFileSync(join(dir, ".some-agent-cache", "state.db"), "db\n");
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".some-agent-cache/state.db");
  });

  test("allows the two tracked .beads pointer files but default-denies other .beads paths", () => {
    // config.yaml + .gitignore are in the clean tree (the makeTree fixture) and
    // the clean-tree test above proves they pass. A force-added per-machine
    // .beads/metadata.json (or any other hidden .beads path) is NOT allowlisted
    // — the allowlist is exact-path, not a broad .beads/ prefix.
    const dir = makeTree();
    writeFileSync(join(dir, ".beads", "metadata.json"), "{}\n");
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".beads/metadata.json");
  });

  test("rejects an .ai/*.md note that is not indexed from AGENTS.md", () => {
    const dir = makeTree();
    writeFileSync(join(dir, ".ai", "scratch.md"), "unindexed\n");
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".ai/scratch.md");
    expect(output).toContain("not indexed");
  });

  test("a prose-only AGENTS.md mention does not count as indexing (li-6tntj5)", () => {
    const dir = makeTree();
    writeFileSync(join(dir, ".ai", "leak.md"), "private memory\n");
    writeFileSync(
      join(dir, "AGENTS.md"),
      "# AGENTS.md\n\nSee `.ai/leak.md` for scratch thoughts.\n\n" +
        "## Agent-facing notes index\n\n" +
        "- `.ai/decisions.md` — fixture note\n",
    );
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".ai/leak.md");
    expect(output).toContain("not indexed");
  });

  test("an index entry without a stated purpose is rejected (li-6tntj5)", () => {
    const dir = makeTree();
    writeFileSync(join(dir, ".ai", "leak.md"), "private memory\n");
    writeFileSync(
      join(dir, "AGENTS.md"),
      "# AGENTS.md\n\n## Agent-facing notes index\n\n" +
        "- `.ai/decisions.md` — fixture note\n" +
        "- `.ai/leak.md`\n",
    );
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".ai/leak.md");
    expect(output).toContain("purpose");
  });

  test("rejects .idea workspace/local state while allowing shareable project configuration (li-6tntj5)", () => {
    const dir = makeTree();
    writeFileSync(join(dir, ".idea", "workspace.xml"), "<project />\n");
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".idea/workspace.xml");
  });

  test("rejects an AGENTS.md reference to a missing .ai note", () => {
    const dir = makeTree();
    writeFileSync(
      join(dir, "AGENTS.md"),
      "# AGENTS.md\n\n- `.ai/decisions.md` — fixture note\n" +
        "- `.ai/missing.md` — dangling reference\n",
    );
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".ai/missing.md");
  });

  test("rejects non-markdown and nested entries under .ai/", () => {
    const dir = makeTree();
    writeFileSync(join(dir, ".ai", "cache.json"), "{}\n");
    mkdirSync(join(dir, ".ai", "sub"), { recursive: true });
    writeFileSync(join(dir, ".ai", "sub", "nested.md"), "nested\n");
    const { exitCode, output } = runMemory(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain(".ai/cache.json");
    expect(output).toContain(".ai/sub/nested.md");
  });

  test("passes the current repository tree", () => {
    const { exitCode, output } = runMemory(repoRoot);
    expect(output).not.toContain("REJECTED");
    expect(exitCode).toBe(0);
  });
});

describe("local memory guardrail — staged mode and hook (li-6b6u6m)", () => {
  function makeGitTree(): string {
    const dir = makeTree();
    git(dir, "init", "-q", "-b", "master");
    git(dir, "config", "user.email", "memory@example.invalid");
    git(dir, "config", "user.name", "Memory Fixture");
    return dir;
  }

  test("--staged outside a git repository is a precondition failure (exit 3)", () => {
    const { exitCode } = runMemory(makeTree(), "--staged");
    expect(exitCode).toBe(3);
  });

  test("--staged rejects a staged prohibited path", () => {
    const dir = makeGitTree();
    git(dir, "add", "-A");
    mkdirSync(join(dir, ".codex"), { recursive: true });
    writeFileSync(join(dir, ".codex", "leak.md"), "memory\n");
    git(dir, "add", "-f", ".codex/leak.md");
    const { exitCode, output } = runMemory(dir, "--staged");
    expect(exitCode).toBe(1);
    expect(output).toContain(".codex/leak.md");
  });

  test("--staged validates the STAGED AGENTS.md, not the working tree", () => {
    const dir = makeGitTree();
    // The disk AGENTS.md indexes the note, but only the note is staged: the
    // staged tree has no AGENTS.md, so the staged note is unindexed there.
    git(dir, "add", ".ai/decisions.md");
    expect(runMemory(dir, "--staged").exitCode).toBe(1);
    expect(runMemory(dir).exitCode).toBe(0);
    git(dir, "add", "-A");
    expect(runMemory(dir, "--staged").exitCode).toBe(0);
  });

  test("the committed pre-commit hook exists and runs the staged guard", () => {
    const hookPath = join(repoRoot, ".githooks", "pre-commit");
    expect(existsSync(hookPath)).toBe(true);
    const mode = statSync(hookPath).mode;
    expect(mode & 0o111).not.toBe(0);
    const hook = readFileSync(hookPath, "utf8");
    expect(hook).toContain("check-memory.ts");
    expect(hook).toContain("--staged");
  });

  test("the installed hook blocks a commit adding a prohibited path and allows a clean one", () => {
    const dir = makeGitTree();
    git(dir, "config", "core.hooksPath", join(repoRoot, ".githooks"));
    git(dir, "add", "-A");
    expect(git(dir, "commit", "-m", "chore: init fixture").exitCode).toBe(0);
    mkdirSync(join(dir, ".codex"), { recursive: true });
    writeFileSync(join(dir, ".codex", "leak.md"), "memory\n");
    git(dir, "add", "-f", ".codex/leak.md");
    const blocked = git(dir, "commit", "-m", "chore: leak memory");
    expect(blocked.exitCode).not.toBe(0);
    expect(blocked.output).toContain(".codex/leak.md");
    git(dir, "reset", "-q");
    writeFileSync(join(dir, "README.md"), "# fixture\n");
    git(dir, "add", "README.md");
    expect(git(dir, "commit", "-m", "docs: readme").exitCode).toBe(0);
  }, 240000);

  test("the installed hook blocks both watcher-reported bypasses (li-6tntj5)", () => {
    const dir = makeGitTree();
    git(dir, "config", "core.hooksPath", join(repoRoot, ".githooks"));
    git(dir, "add", "-A");
    expect(git(dir, "commit", "-m", "chore: init fixture").exitCode).toBe(0);
    // Bypass 1: a note mentioned only in prose, not in the notes index.
    writeFileSync(join(dir, ".ai", "leak.md"), "private memory\n");
    writeFileSync(
      join(dir, "AGENTS.md"),
      "# AGENTS.md\n\nSee `.ai/leak.md` for scratch thoughts.\n\n" +
        "## Agent-facing notes index\n\n" +
        "- `.ai/decisions.md` — fixture note\n",
    );
    git(dir, "add", ".ai/leak.md", "AGENTS.md");
    const proseOnly = git(dir, "commit", "-m", "chore: leak via prose");
    expect(proseOnly.exitCode).not.toBe(0);
    expect(proseOnly.output).toContain(".ai/leak.md");
    git(dir, "reset", "-q", "--hard");
    // Bypass 2: JetBrains workspace/local state under .idea/.
    writeFileSync(join(dir, ".idea", "workspace.xml"), "<project />\n");
    git(dir, "add", "-f", ".idea/workspace.xml");
    const workspace = git(dir, "commit", "-m", "chore: leak workspace state");
    expect(workspace.exitCode).not.toBe(0);
    expect(workspace.output).toContain(".idea/workspace.xml");
  }, 240000);

  test("the aggregate check runs the memory guardrail as an operational gate", () => {
    const run = Bun.spawnSync({
      cmd: [
        "bun",
        join(repoRoot, "scripts", "check.ts"),
        "--project-root",
        repoRoot,
      ],
      cwd: repoRoot,
      env: {
        ...process.env,
        CHECK_SKIP_HARNESS_TESTS: "1",
        CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
      },
    });
    const output = run.stdout.toString() + run.stderr.toString();
    const gateLine = output
      .split("\n")
      .find((line) => line.includes("local memory guardrail"));
    expect(gateLine).toBeDefined();
    expect(gateLine).toContain("[ok]");
    expect(run.exitCode).toBe(0);
  }, 240000);
});
