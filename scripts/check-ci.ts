// Verifies GitHub CI and pull-request automation per
// SPECIFICATION/non-functional-requirements.md §"GitHub CI and pull request
// discipline" and §"Pull request landing automation". Used in-process by the
// aggregate check (scripts/check.ts) and runnable standalone:
// bun scripts/check-ci.ts [--project-root <path>] [--live]
//
// Local verification (always):
// - .github/workflows/check.yml runs on pull_request -> master and
//   push -> master, checks out full history (fetch-depth: 0 — the TDD
//   branch-range validator must not see a shallow base), installs the
//   pinned Bun (setup-bun with a version/version-file pin), installs
//   dependencies from the lockfile (--frozen-lockfile), and runs
//   `bun run check`; every `bun run <script>` it invokes must be a named
//   package.json script (CI delegates, never embeds divergent logic).
// - .github/workflows/auto-enable-merge.yml triggers on the five required
//   pull_request event types, skips drafts and do-not-merge labels, limits
//   eligibility to the repository owner (or an explicit allowlist), mints a
//   short-lived GitHub App installation token (secrets APP_ID /
//   APP_PRIVATE_KEY), and enables rebase auto-merge via
//   `gh pr merge ... --auto --rebase`.
// - .github/workflows/bump-plugin-pin.yml, when present, carries a `schedule`
//   trigger and a `releases/latest` pull resolve, and — if it opens a pull
//   request — auto-enable-merge.yml allowlists an automation identity, so the
//   pin advances unattended rather than merely opening a pull request.
// - No workflow may implement an auto-update-branches mechanism.
// - .github/README.md documents the required status-check name, merge
//   methods, branch-protection/linear-history layout, non-strict policy,
//   the do-not-merge label, and the App secrets.
// - Per §"Local secret injection": .github/README.md and scripts/README.md
//   document the committed with-resume-env.sh wrapper for secret-needing
//   local commands (e.g. CHECK_LIVE_GITHUB=1), and a committed
//   with-resume-env.sh, when present, is the rendered factory artifact for
//   the resume identifier (generated header, op run --environment) and
//   carries no secret values.
//
// Live verification (--live, or CHECK_LIVE_GITHUB=1 through the aggregate
// check): queries the GitHub API through `gh` for the actual repository
// settings — rebase-only merge methods, auto-merge enabled, and effective
// master branch rules (required "check" status, non-strict, linear
// history). The spec makes live verification optional-when-credentialed;
// local documented verification always runs.
//
// Exit codes per §"Exit-code baseline": 0 ok, 1 verification failure,
// 2 usage error, 3 precondition failure (.github/workflows missing, or
// --live without a working gh).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const REQUIRED_STATUS_CONTEXT = "check";

const REQUIRED_AUTO_MERGE_EVENTS = [
  "opened",
  "reopened",
  "ready_for_review",
  "synchronize",
  "unlabeled",
] as const;

const GITHUB_DOC_PATH = ".github/README.md";

// The documentation must name each of these so the settings layout is
// reconstructible without GitHub access (spec: settings "documented").
const REQUIRED_DOC_MENTIONS: readonly [string, string][] = [
  ["`check`", "the required status-check name"],
  ["rebase", "the allowed merge method"],
  ["squash", "the disabled squash method"],
  ["linear history", "the linear-history requirement"],
  ["strict", "the non-strict required-checks policy"],
  ["APP_ID", "the GitHub App id secret"],
  ["APP_PRIVATE_KEY", "the GitHub App private-key secret"],
  ["do-not-merge", "the auto-merge opt-out label"],
  [
    "with-resume-env.sh",
    'the local secret-injection wrapper (NFR §"Local secret injection")',
  ],
];

const SCRIPTS_DOC_PATH = "scripts/README.md";
const WRAPPER_BASENAME = "with-resume-env.sh";

// While the maintainer's 1Password bootstrap has not rendered the wrapper,
// the docs must say so with this exact marker — docs claiming a committed
// wrapper that is absent would be untruthful, and a landed wrapper with a
// leftover marker is stale.
const PENDING_WRAPPER_MARKER = "render pending maintainer 1Password bootstrap";

export interface CiVerification {
  readonly status: "absent" | "fail" | "ok";
  readonly failures: readonly string[];
}

interface PackageJson {
  readonly scripts?: Record<string, string>;
}

interface WorkflowStep {
  readonly uses?: string;
  readonly run?: string;
  readonly with?: Record<string, unknown>;
}

interface Workflow {
  readonly on?: Record<string, unknown>;
  readonly jobs?: Record<
    string,
    { readonly if?: string; readonly steps?: WorkflowStep[] }
  >;
}

function parseWorkflow(path: string): Workflow | null {
  try {
    return Bun.YAML.parse(readFileSync(path, "utf8")) as Workflow;
  } catch {
    return null;
  }
}

function workflowSteps(workflow: Workflow): WorkflowStep[] {
  return Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);
}

function triggerBranches(workflow: Workflow, event: string): string[] {
  const trigger = (workflow.on ?? {})[event];
  if (trigger === null || typeof trigger !== "object") {
    return [];
  }
  const branches = (trigger as Record<string, unknown>)["branches"];
  return Array.isArray(branches) ? branches.map(String) : [];
}

function verifyCheckWorkflow(root: string, pkg: PackageJson): string[] {
  const path = join(root, ".github", "workflows", "check.yml");
  if (!existsSync(path)) {
    return [".github/workflows/check.yml is missing"];
  }
  const workflow = parseWorkflow(path);
  if (workflow === null) {
    return [".github/workflows/check.yml is not parseable YAML"];
  }
  const failures: string[] = [];
  if (!triggerBranches(workflow, "pull_request").includes("master")) {
    failures.push("check.yml must run on pull_request events targeting master");
  }
  if (!triggerBranches(workflow, "push").includes("master")) {
    failures.push("check.yml must run on push events to master");
  }
  const steps = workflowSteps(workflow);
  const checkout = steps.find((s) =>
    (s.uses ?? "").includes("actions/checkout"),
  );
  if (checkout?.with?.["fetch-depth"] !== 0) {
    failures.push(
      "check.yml must check out full history (fetch-depth: 0) so the TDD branch-range base is resolvable",
    );
  }
  const setupBun = steps.find((s) => (s.uses ?? "").includes("setup-bun"));
  if (
    setupBun === undefined ||
    (setupBun.with?.["bun-version"] === undefined &&
      setupBun.with?.["bun-version-file"] === undefined)
  ) {
    failures.push(
      "check.yml must install the pinned Bun toolchain (setup-bun with bun-version or bun-version-file)",
    );
  }
  const runLines = steps.map((s) => s.run ?? "").filter((r) => r.length > 0);
  if (!runLines.some((r) => r.includes("bun install --frozen-lockfile"))) {
    failures.push(
      "check.yml must install dependencies from the lockfile (bun install --frozen-lockfile)",
    );
  }
  if (!runLines.some((r) => /bun run check\b/.test(r))) {
    failures.push("check.yml must run the aggregate check (bun run check)");
  }
  const scripts = pkg.scripts ?? {};
  for (const runLine of runLines) {
    for (const match of runLine.matchAll(/bun run ([A-Za-z0-9:_-]+)/g)) {
      const script = match[1] ?? "";
      if (!(script in scripts)) {
        failures.push(
          `check.yml must delegate to named package scripts; "bun run ${script}" is not a package.json script`,
        );
      }
    }
  }
  return failures;
}

function verifyAutoMergeWorkflow(root: string): string[] {
  const path = join(root, ".github", "workflows", "auto-enable-merge.yml");
  if (!existsSync(path)) {
    return [".github/workflows/auto-enable-merge.yml is missing"];
  }
  const workflow = parseWorkflow(path);
  if (workflow === null) {
    return [".github/workflows/auto-enable-merge.yml is not parseable YAML"];
  }
  const failures: string[] = [];
  const raw = readFileSync(path, "utf8");
  const trigger = (workflow.on ?? {})["pull_request"];
  const types =
    trigger !== null && typeof trigger === "object"
      ? (trigger as Record<string, unknown>)["types"]
      : undefined;
  const typeList = Array.isArray(types) ? types.map(String) : [];
  for (const event of REQUIRED_AUTO_MERGE_EVENTS) {
    if (!typeList.includes(event)) {
      failures.push(
        `auto-enable-merge.yml must trigger on pull_request type "${event}"`,
      );
    }
  }
  if (!raw.includes("draft == false")) {
    failures.push("auto-enable-merge.yml must skip draft pull requests");
  }
  if (!raw.includes("do-not-merge")) {
    failures.push(
      "auto-enable-merge.yml must skip pull requests labeled do-not-merge",
    );
  }
  if (!raw.includes("github.repository_owner")) {
    failures.push(
      "auto-enable-merge.yml must limit eligibility to the repository owner or an explicit allowlist",
    );
  }
  const usesAppToken = workflowSteps(workflow).some((s) =>
    (s.uses ?? "").includes("actions/create-github-app-token"),
  );
  if (
    !usesAppToken ||
    !raw.includes("secrets.APP_ID") ||
    !raw.includes("secrets.APP_PRIVATE_KEY")
  ) {
    failures.push(
      "auto-enable-merge.yml must mint a short-lived GitHub App installation token (actions/create-github-app-token with secrets.APP_ID / secrets.APP_PRIVATE_KEY), not GITHUB_TOKEN",
    );
  }
  if (!raw.includes("gh pr merge") || !raw.includes("--auto --rebase")) {
    failures.push(
      "auto-enable-merge.yml must enable rebase auto-merge via gh pr merge --auto --rebase",
    );
  }
  return failures;
}

function verifyNoBranchUpdater(root: string): string[] {
  const dir = join(root, ".github", "workflows");
  const failures: string[] = [];
  for (const name of readdirSync(dir)) {
    const raw = readFileSync(join(dir, name), "utf8");
    if (raw.includes("update-branch") || raw.includes("update_branch")) {
      failures.push(
        `.github/workflows/${name} implements a prohibited auto-update-branches mechanism (behind PRs are handled by rebase auto-merge at merge time)`,
      );
    }
  }
  return failures;
}

// The plugin-pin bump lane must be able to run UNATTENDED, which is a property
// of three things agreeing across two files. Each was separately absent at some
// point, and the lane looked healthy every time:
//
//   1. a `schedule` trigger — without it the lane depends entirely on the
//      producer's `repository_dispatch`, which is unauthorized by design
//      (adopters bring their own App). Measured on livespec-overseer v0.13.0:
//      `delivered: 0, unauthorized: 3`. No schedule, no advance, ever.
//   2. a PULL resolve of the source repository's latest release, so a run that
//      carries no payload and no input can still determine a tag. A scheduled
//      run has neither.
//   3. if the lane opens a PULL REQUEST, `auto-enable-merge.yml` must allowlist
//      the identity that opens it. This is the one that actually bit: the lane
//      opened PRs #8 and #9 as `resume-pr-bot[bot]`, auto-enable-merge gated on
//      the repository owner alone, both runs read `skipped`, and both PRs were
//      merged by hand. The lane had degraded from "the pin advances" to "a pull
//      request appears" with nothing red.
//
// Note why the pre-existing `github.repository_owner` assertion could not catch
// (3): it is satisfied by the owner-only expression, which is exactly the
// broken state. A cross-file coupling needs a cross-file check.
//
// Scoped to a repository that HAS this lane — a repo without
// bump-plugin-pin.yml is not in violation, it simply is not a pinned consumer.
function verifyPinBumpLane(root: string): string[] {
  const path = join(root, ".github", "workflows", "bump-plugin-pin.yml");
  if (!existsSync(path)) {
    return [];
  }
  const workflow = parseWorkflow(path);
  if (workflow === null) {
    return [".github/workflows/bump-plugin-pin.yml is not parseable YAML"];
  }
  const failures: string[] = [];
  const raw = readFileSync(path, "utf8");
  const schedule = (workflow.on ?? {})["schedule"];
  if (!Array.isArray(schedule) || schedule.length === 0) {
    failures.push(
      "bump-plugin-pin.yml must carry a `schedule` trigger — it is the only path that advances the pin without a cross-repo credential, since the producer's dispatch hop is unauthorized by design",
    );
  }
  if (!raw.includes("releases/latest")) {
    failures.push(
      "bump-plugin-pin.yml must resolve the source repository's latest release (releases/latest) when no tag is supplied — a scheduled run carries neither a dispatch payload nor an input",
    );
  }
  if (raw.includes("gh pr create")) {
    const mergePath = join(
      root,
      ".github",
      "workflows",
      "auto-enable-merge.yml",
    );
    const mergeWorkflow = existsSync(mergePath)
      ? parseWorkflow(mergePath)
      : null;
    // Read the PARSED eligibility expressions, never the file text. The first
    // version of this check scanned the raw file for "[bot]" and stayed GREEN
    // under the sabotage it exists to catch, because the surrounding comment
    // block names the bot in prose. A substring hit in a comment proves the
    // identity was DISCUSSED, not that it is eligible.
    const eligibility = Object.values(mergeWorkflow?.jobs ?? {})
      .map((job) => job.if ?? "")
      .join("\n");
    if (!eligibility.includes("[bot]")) {
      failures.push(
        "bump-plugin-pin.yml opens a pull request, but auto-enable-merge.yml's job eligibility expression allowlists no automation identity — the bump pull request would open and then wait for a human, so the pin would not advance unattended",
      );
    }
  }
  return failures;
}

function verifyDocumentation(root: string): string[] {
  const path = join(root, GITHUB_DOC_PATH);
  if (!existsSync(path)) {
    return [
      `${GITHUB_DOC_PATH} is missing — the required status-check name and branch-protection/merge-method settings must be documented`,
    ];
  }
  const doc = readFileSync(path, "utf8");
  const failures: string[] = [];
  for (const [needle, what] of REQUIRED_DOC_MENTIONS) {
    if (!doc.includes(needle)) {
      failures.push(`${GITHUB_DOC_PATH} must document ${what} ("${needle}")`);
    }
  }
  return failures;
}

// Per NFR §"Local secret injection": scripts/README.md must document
// running secret-needing commands (the CHECK_LIVE_GITHUB=1 live check
// today) through the committed wrapper.
function verifyScriptsDocumentation(root: string): string[] {
  const path = join(root, SCRIPTS_DOC_PATH);
  if (!existsSync(path)) {
    return [
      `${SCRIPTS_DOC_PATH} is missing — secret-needing command usage through the local wrapper must be documented`,
    ];
  }
  const doc = readFileSync(path, "utf8");
  const failures: string[] = [];
  if (!doc.includes(WRAPPER_BASENAME) || !doc.includes("CHECK_LIVE_GITHUB")) {
    failures.push(
      `${SCRIPTS_DOC_PATH} must document running secret-needing commands (CHECK_LIVE_GITHUB=1) through the ${WRAPPER_BASENAME} wrapper (NFR §"Local secret injection")`,
    );
  }
  return failures;
}

// Until the maintainer's 1Password bootstrap renders the wrapper, the
// docs must record that pending state (PENDING_WRAPPER_MARKER) rather
// than claim a committed wrapper that is absent; once present the marker
// must be gone and the wrapper must be the untouched factory artifact
// for THIS repository, carrying no secret values.
function verifySecretInjectionWrapper(root: string): string[] {
  const path = join(root, WRAPPER_BASENAME);
  // Markdown hard-wraps prose, so the marker may span lines; match on
  // whitespace-normalized text.
  const hasMarker = (doc: string): boolean =>
    doc.replace(/\s+/g, " ").includes(PENDING_WRAPPER_MARKER);
  const readDoc = (rel: string): string => {
    const docPath = join(root, rel);
    return existsSync(docPath) ? readFileSync(docPath, "utf8") : "";
  };
  const githubDoc = readDoc(GITHUB_DOC_PATH);
  const scriptsDoc = readDoc(SCRIPTS_DOC_PATH);
  if (!existsSync(path)) {
    if (!hasMarker(githubDoc)) {
      return [
        `${WRAPPER_BASENAME} is not committed, and ${GITHUB_DOC_PATH} does not record the pending state ("${PENDING_WRAPPER_MARKER}") — the docs must not claim a committed wrapper that is absent`,
      ];
    }
    return [];
  }
  const wrapper = readFileSync(path, "utf8");
  const failures: string[] = [];
  for (const [doc, rel] of [
    [githubDoc, GITHUB_DOC_PATH],
    [scriptsDoc, SCRIPTS_DOC_PATH],
  ] as const) {
    if (hasMarker(doc)) {
      failures.push(
        `${rel} still calls the wrapper "${PENDING_WRAPPER_MARKER}" but ${WRAPPER_BASENAME} is committed — remove the stale pending marker`,
      );
    }
  }
  if (!wrapper.includes("GENERATED BUILD ARTIFACT")) {
    failures.push(
      `${WRAPPER_BASENAME} must be the generated factory artifact (missing the generated-artifact header; never hand-edit the wrapper)`,
    );
  }
  if (!wrapper.includes("IDENTIFIER='resume'")) {
    failures.push(
      `${WRAPPER_BASENAME} must be rendered for the resume identifier (IDENTIFIER='resume')`,
    );
  }
  if (!wrapper.includes("op run") || !wrapper.includes("--environment")) {
    failures.push(
      `${WRAPPER_BASENAME} must inject its 1Password Environment via op run --environment`,
    );
  }
  if (
    /ops_[A-Za-z0-9_-]{16,}/.test(wrapper) ||
    wrapper.includes("PRIVATE KEY-----")
  ) {
    failures.push(
      `${WRAPPER_BASENAME} must not contain secret values (service-account token or key material found)`,
    );
  }
  return failures;
}

export function verifyCiProvisioning(root: string): CiVerification {
  if (!existsSync(join(root, ".github", "workflows"))) {
    return { status: "absent", failures: [] };
  }
  const packageJsonPath = join(root, "package.json");
  const pkg: PackageJson = existsSync(packageJsonPath)
    ? (JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson)
    : {};
  const failures = [
    ...verifyCheckWorkflow(root, pkg),
    ...verifyAutoMergeWorkflow(root),
    ...verifyPinBumpLane(root),
    ...verifyNoBranchUpdater(root),
    ...verifyDocumentation(root),
    ...verifyScriptsDocumentation(root),
    ...verifySecretInjectionWrapper(root),
  ];
  return failures.length > 0
    ? { status: "fail", failures }
    : { status: "ok", failures: [] };
}

interface GhResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function gh(root: string, ...args: readonly string[]): GhResult {
  const run = Bun.spawnSync({ cmd: ["gh", ...args], cwd: root });
  return {
    exitCode: run.exitCode,
    stdout: run.stdout.toString(),
    stderr: run.stderr.toString(),
  };
}

// Live settings verification through the GitHub API. Fails actionably when
// required branch protection, linear history, the required aggregate-check
// status, or the merge-method settings are absent or misconfigured.
export function verifyLiveGitHubSettings(root: string): string[] {
  const repoRes = gh(root, "api", "repos/{owner}/{repo}");
  if (repoRes.exitCode !== 0) {
    return [
      `live verification could not query the repository via gh: ${repoRes.stderr.trim().split("\n")[0] ?? "unknown error"}`,
    ];
  }
  const failures: string[] = [];
  const repo = JSON.parse(repoRes.stdout) as Record<string, unknown>;
  const settings: readonly [string, boolean, string][] = [
    ["allow_rebase_merge", true, "rebase merge must be allowed"],
    ["allow_squash_merge", false, "squash merge must be disabled"],
    ["allow_merge_commit", false, "merge commits must be disabled"],
    ["allow_auto_merge", true, "pull-request auto-merge must be enabled"],
  ];
  for (const [key, expected, what] of settings) {
    if (repo[key] !== expected) {
      failures.push(`${what} (${key} is ${String(repo[key])})`);
    }
  }
  // Ruleset-derived rules (the /rules endpoint does NOT surface classic
  // branch protection, so both sources are consulted).
  const rulesRes = gh(
    root,
    "api",
    "repos/{owner}/{repo}/rules/branches/master",
  );
  const rules =
    rulesRes.exitCode === 0
      ? (JSON.parse(rulesRes.stdout) as {
          type: string;
          parameters?: Record<string, unknown>;
        }[])
      : [];
  const protectionRes = gh(
    root,
    "api",
    "repos/{owner}/{repo}/branches/master/protection",
  );
  const protection =
    protectionRes.exitCode === 0
      ? (JSON.parse(protectionRes.stdout) as {
          required_status_checks?: { strict?: boolean; contexts?: string[] };
          required_linear_history?: { enabled?: boolean };
        })
      : {};
  const linearViaRuleset = rules.some(
    (rule) => rule.type === "required_linear_history",
  );
  if (
    !linearViaRuleset &&
    protection.required_linear_history?.enabled !== true
  ) {
    failures.push(
      "master must require linear history (neither a ruleset rule nor classic branch protection enables it)",
    );
  }
  // Linear history must bind administrators: a no-bypass ruleset is the
  // documented mechanism (classic protection with enforce_admins off does
  // not apply to admins).
  if (!linearViaRuleset) {
    failures.push(
      "linear history must apply to administrators via a no-bypass ruleset (see .github/README.md)",
    );
  }
  const statusRule = rules.find(
    (rule) => rule.type === "required_status_checks",
  );
  const rulesetContexts = (
    (statusRule?.parameters?.["required_status_checks"] as
      { context?: string }[] | undefined) ?? []
  ).map((entry) => entry.context ?? "");
  const contexts = [
    ...(protection.required_status_checks?.contexts ?? []),
    ...rulesetContexts,
  ];
  if (!contexts.includes(REQUIRED_STATUS_CONTEXT)) {
    failures.push(
      `master branch protection must require the "${REQUIRED_STATUS_CONTEXT}" status check before merge`,
    );
  }
  if (
    protection.required_status_checks?.strict === true ||
    statusRule?.parameters?.["strict_required_status_checks_policy"] === true
  ) {
    failures.push(
      "required status checks must NOT use strict mode (it breaks rebase auto-merge linear history)",
    );
  }
  return failures;
}

if (import.meta.main) {
  let root = process.cwd();
  let live = false;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--live") {
      live = true;
    } else if (arg === "--project-root") {
      const value = argv[i + 1];
      if (value === undefined) {
        console.error(
          "usage: bun scripts/check-ci.ts [--project-root <path>] [--live]",
        );
        process.exit(2);
      }
      root = resolve(value);
      i += 1;
    } else {
      console.error(
        "usage: bun scripts/check-ci.ts [--project-root <path>] [--live]",
      );
      process.exit(2);
    }
  }
  const result = verifyCiProvisioning(root);
  if (result.status === "absent") {
    console.error(
      "precondition failure: .github/workflows/ is missing — CI provisioning has not landed in this tree",
    );
    process.exit(3);
  }
  const failures = [...result.failures];
  if (live) {
    failures.push(...verifyLiveGitHubSettings(root));
  }
  if (failures.length > 0) {
    console.error(
      `github ci/pr automation: FAIL — ${String(failures.length)} problem(s):`,
    );
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }
  console.log(
    `github ci/pr automation: ok (workflows, delegation, documentation${live ? ", live settings" : ""}).`,
  );
}
