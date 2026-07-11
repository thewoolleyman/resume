# Handoff - MVP (ported + redesigned + live + reviewed)

**Thread:** `plan/mvp/` - **Driver-agnostic:** paste this file's path into
either Claude Code or Codex. The goal is to complete the **MVP** — the
predecessor site ported to data/behavior parity (interactive resume at `/`,
static resume at `/static`), **visually redesigned**, **deployed live across
all environment classes**, and **thoroughly reviewed on the running site** —
under the repository guardrail discipline that `plan/archive/guardrail/` provisioned
and proved.

## Read first

1. `plan/mvp/research/findings.md` — what the MVP is (ported + redesigned +
   live + reviewed), what it is NOT (no AI/MCP — that is `plan/ai/`), the
   work-slice order, and the completion criteria.
2. `SPECIFICATION/spec.md` §"Delivery phases" (head **v026** — the redefined
   MVP), `contracts.md` §"Web routes" / §"Environment contract",
   `constraints.md` §"Framework and deployment", and `scenarios.md` — the
   authoritative product requirements.
3. `SPECIFICATION/non-functional-requirements.md` — the guardrail discipline
   every commit runs under (already enforced by `bun run check` and the
   installed hooks).

## What this thread is

This plan completes the MVP: the interactive and static surfaces ported to
predecessor **data and behavior** parity, then **redesigned**, **deployed
live** across Development / Preview / Production (at
`https://resume.thewoolleyweb.com`), and **reviewed on the running site** by
both the LLMs and the maintainer. A green local `bun run check` is a
precondition of — never a substitute for — the live deployment and review.

This thread does **NOT** implement AI-driven mode (`/ai` answering behavior) or
the MCP server. Those are a separate, later delivery planned in **`plan/ai/`**,
activated only by a future proposed change, and held to the same
live-and-reviewed bar. `/ai` MAY be omitted or a documented placeholder in the
MVP.

## Loop autonomously until blocked or complete

Drive work items in a continuous loop within the session — do NOT stop after
one action. Each iteration:

1. Pick the ripe item: run the livespec-orchestrator-beads-fabro
   `needs-attention` skill for cross-plan triage, or `next` to rank the next
   work item.
2. Execute it: run the livespec-orchestrator-beads-fabro `drive --action
   <action-id>`, or `implement` for that one item (Red -> Green, close with
   merge evidence).
3. Commit and push each coherent unit to `master` automatically, matching the
   repository's `AGENTS.md` convention, then continue to the next iteration.

If no remaining MVP work items exist yet, seed them from
`plan/mvp/research/findings.md` §"Work slices" (the remaining R1-R4 slices)
using livespec-orchestrator-beads-fabro `capture-work-item` (small,
dependency-ordered items with human-readable titles), or let `capture-impl-gaps`
surface spec->impl gaps to file.

STOP looping only when one of these holds:

- **MVP complete** — `findings.md` §"Completion criteria" is fully met: ported
  surfaces parity-green, redesign applied, site live across all environment
  classes, and the running site reviewed and signed off by the maintainer.
  Perform the Terminal step.
- **Maintainer blocker** — a decision or intervention only the human maintainer
  can provide. For this thread the known blockers are: **Vercel project linkage
  and deploy credentials + custom-domain DNS** (slice R1, live deployment); the
  **maintainer's visual design pass with Claude Design** (slice R2); and the
  **maintainer's review and sign-off on the running Production site** (slice
  R4). Also: any needed spec change (propose-change/revise), a conflict with a
  ratified decision, or anything destructive/irreversible. State the blocker in
  human-readable terms and what decision or action is needed.
- **Session limits** — the context or session is ending; land what is coherent,
  never a half-implemented surface or a red gate.

When the loop pauses or stops, report in human-readable terms what was done and
which files, surfaces, or scenarios it affects; update §"Where the loop stands
now" when the non-derivable state changed; and END the report with the next
handoff prompt line from §"Resume" plus a description of the next ripe action
(or the blocker awaiting the maintainer).

## Required ordering

The ported surface (slices 1-10 in `findings.md`) is built and merged. Drive the
**remaining** MVP work in `findings.md` §"Work slices" order:

- **R1. Live deployment across all environment classes** (maintainer blocker:
  Vercel linkage/credentials + DNS). Live and reachable in Development, Preview,
  and Production at `https://resume.thewoolleyweb.com`; Preview non-indexed.
- **R2. Visual redesign** (maintainer performs the design pass with Claude
  Design). Applied under guardrail discipline; preserves every behavioral
  scenario and the accessibility/responsive/no-horizontal-scroll requirements.
- **R3. Redeploy the redesigned site** across all environment classes.
- **R4. Thorough review of the running site** by the LLMs and the maintainer;
  resolve findings; maintainer signs off on Production.

## Terminal step

When the MVP meets `findings.md` §"Completion criteria" (ported surfaces
parity-green with `bun run check` all-gates-ACTIVE; site live across
Development / Preview / Production at the custom domain; redesign applied on the
live site preserving all behavioral scenarios and a11y/responsive requirements;
the running site reviewed by the LLMs and the maintainer with findings resolved
and maintainer sign-off):

1. Verify the live Production site at `https://resume.thewoolleyweb.com` and the
   Preview environment satisfy `constraints.md` §"Framework and deployment",
   §"Accessibility and responsive behavior", and §"Performance and
   availability", and that Preview is non-indexed.
2. Report MVP completion and hand off to the maintainer for the **AI delivery**
   (`plan/ai/`), which begins only when a future proposed change activates the
   AI/MCP surfaces.
3. Commit and push with a conventional message such as
   `docs(plan): complete mvp`.

## Standing rules

- Always commit and land coherent work to `master`; do not ask for
  confirmation.
- Preserve the standalone boundary: no runtime, build, test, CI, or hook
  dependency on sibling livespec repositories or Python-only fleet tooling.
- Keep the first-party product-source boundary clear: `src/**` (and Playwright
  specs under `e2e/**`, Vitest `*.test.ts`) is product/test source; repository
  harness/tooling, specs, docs, governed data, CI, hooks, and config are not
  `src/**` product source for the TDD pairing/range gates.
- Do NOT introduce AI answering behavior or an MCP surface in this plan; that is
  `plan/ai/`.
- The redesign MUST NOT weaken any load-bearing scenario, accessibility,
  responsive, or no-horizontal-scroll requirement, and MUST NOT weaken any
  guardrail gate.
- Use livespec propose-change/revise before relying on a behavior change that is
  not already specified.
- NEVER talk to the maintainer using only an opaque phase code, work-item id,
  action id, version id, or command token. Always include a human-readable
  description of the task and the files, behavior, or surface it affects.
- ALWAYS end the session report with the next handoff prompt line from
  §"Resume" plus a human-readable description of the next ripe action.

## Where the loop stands now

Only non-derivable state is recorded here; the current ripe work item is
derivable by running the livespec-orchestrator-beads-fabro `next` skill against
the beads store.

**Current state: THE MVP IS COMPLETE (2026-07-11).** PORT + R1 (live deploy) +
R2 (redesign) + R3 (redeploy) + R4 (review + sign-off) are all DONE. The
maintainer reviewed the running Production site and gave explicit sign-off; R4
(beads `li-88e`) is CLOSED with sign-off evidence and no work items remain open.
Spec head is **v034**. The redesigned, reviewed site is live at
`https://resume.thewoolleyweb.com` (and `/static`). All R4 review findings F1–F5
are resolved and verified live (F1+F2 `fe90226`; F3+F4+F5 `8ab0b3b`). The
Terminal step is done: Production/Preview verified against `constraints.md`
§"Framework and deployment" / §"Accessibility and responsive behavior" /
§"Performance and availability" (Preview non-indexed via Vercel SSO +
absolute-origin canonical); 16 sections / 74 items live; all 36 scenarios green;
`bun run check` all-gates-ACTIVE. **This thread (`plan/mvp/`) is complete.** The
next milestone is the separate **AI delivery** in **`plan/ai/`** — the `/ai`
answering behavior and the MCP server — which begins only when a future livespec
proposed change activates those surfaces and is held to the same
live-and-reviewed bar. No further `plan/mvp/` action is ripe.

- **R4 findings F3 + F4 + F5 — DONE + landed live (2026-07-11, commit
  `8ab0b3b`, master).** Maintainer-directed after the F1/F2 round. **F3**: each
  route now self-canonicalizes to its own production URL via a layout `load`
  (`data.canonical` from `$lib/canonical`; absolute production origin keeps
  Preview non-canonical) — verified live `/`→`…/`, `/static`→`…/static`.
  **F4**: added `static/robots.txt` (allow-all + `Sitemap:` ref) and
  `static/sitemap.xml` (both routes) — verified live (200; previously
  `/robots.txt` soft-404'd). **F5** (owner mid-review request): markdown bullet
  lists in item descriptions and the About body now place the bullet marker at
  the paragraph's left edge (custom `::before` at `left:0`, text hanging ~20px)
  instead of the browser-default ~40px indent — verified live on all 11 item
  lists. TDD Red→Green single commit (anchor `src/routes/layout.test.ts` asserts
  the per-route canonical); `canonicalHref`/`load` unit-covered; metadata e2e
  asserts per-route canonical + served robots/sitemap; `bun run check`
  all-gates-green; landed via worktree fast-forward; redeployed and verified. No
  governed data / pinned scope / behavioral scenario changed.

- **R4 formal LLM live-site review — DONE + fixes landed live (2026-07-11,
  commit `fe90226`, master).** Reviewed the running Production site (`/` and
  `/static`) across every R4 dimension — deploy/HTTP, metadata parity, cross-links,
  data/behavior parity (16 sections / 74 items live), a11y (16 region landmarks,
  labeled controls), responsive (no h-scroll at 1280 & 375, nav collapses),
  the v034 nav-dropdown dismissal (Escape + outside-click re-verified live),
  light/dark (dark nav band both themes, body-text contrast ≈7.6:1), and search
  (`validated` → exactly `Growth / Lean`; no-match → explicit no-results). All
  pass. Four minor findings surfaced; the maintainer chose to fix **F1 + F2**:
  **F1** promoted the interactive `/` header name from `<p>` to
  `<h1 class="resume-name">` (it was the only surface without an `<h1>`; `/static`
  already had one) — visual byte-unchanged since `.resume-name` pins
  margin/font-size/font-weight; **F2** added `color-scheme: light dark` on `:root`
  (content-area sort `<select>`s follow the OS theme) and `color-scheme: dark` on
  the always-dark `.sticky-nav` (search box + Skill Levels checkboxes). TDD
  Red→Green single commit (anchor `ResumeApp.test.ts` asserts the `<h1>`);
  `bun run check` all-gates-green; landed via worktree fast-forward; redeployed
  (`vercel deploy --prod`, auto-aliased to the custom domain) and verified live
  (exactly one `<h1>`, `H1→H2` outline, both `color-scheme` rules in the served
  CSS). Findings **F3** (`/static` canonical → `/`, confirm intent) and **F4**
  (no `robots.txt`, acceptable) were left as-is per the maintainer's F1+F2 focus.
  No governed data / pinned scope / behavioral scenario changed.

- **R4 review fixes — landed + live (2026-07-11, spec v034, commit `f5a0456`).**
  Two owner-reported live-site defects fixed under guardrail discipline: (1) the
  shared `about.content` opening line was neutralized from "my interactive resume"
  to "my resume" (it renders byte-identically on both views) and `/static` gained
  a print-friendly cross-link back to the interactive resume carrying its full
  canonical URL — v034 added the contract requirement (contracts.md §"Web routes")
  and re-pinned the committed-snapshot SHA-256 (`901ad39f…→61e2b2ca…`); (2) the
  Contents/Skill Levels nav dropdowns now dismiss on outside pointer press,
  Escape, or focus-loss (contracts.md §"Layout and controls"). Unit + browser e2e
  coverage added; `bun run check` all-gates-green; deployed and verified live. The
  maintainer reviewed and said "good enough for now" (interim, not a formal MVP
  sign-off).

- **R2 visual redesign — DONE (2026-07-10, spec v033, commit `09d728d`).**
  Claude-driven redesign implemented under guardrail discipline: hand-rolled,
  zero-dependency, standalone design system — self-hosted Geist Sans + Geist Mono
  (SIL OFL-1.1 in `static/fonts/`, no runtime font CDN) and a CSS
  custom-property token layer in `src/app.css` (neutral ramp + one indigo accent;
  light + dark via `prefers-color-scheme`; a `@media print` override forcing
  dark-on-light for readable PDF/print). All five components restyled; the sticky
  nav and header stay a dark band in both themes (contracts.md §"Layout and
  controls" requires a dark-themed nav/header) while the content area is
  theme-adaptive. Every load-bearing scenario, a11y/keyboard/labels, responsive
  collapse, no-horizontal-scroll, and print readability preserved. A prominent
  **Static** nav link (real crawlable `<a href>` to `/static` via `$app/paths`
  `resolve()`) was added at the trailing edge after About — a contract change cut
  as **v033** (contracts.md §"Layout and controls" + the responsive scenario in
  scenarios.md). `bun run check` all-gates-green; visually verified light + dark
  on `/` and `/static` and at a narrow viewport. Beads `li-ysz` closed.

- **R3 redeploy — DONE (2026-07-10).** `master` (`09d728d`) deployed to Vercel
  production via `./with-resume-env.sh bash -c 'vercel deploy --prod --yes --token
  "$VERCEL_TOKEN"'` and re-aliased to the custom domain. Verified live: `/` and
  `/static` 200, both Geist woff2 served (`font/woff2`), Static link + font
  preloads + theme-color present. Beads `li-93c` closed. NOTE: the working deploy
  command needs `--token "$VERCEL_TOKEN"` — Vercel CLI 50.x does NOT auto-read
  `VERCEL_TOKEN` from the environment.

- **GitLab career-item edit — DONE (2026-07-10, spec v032, commit `3e66551`).**
  Owner-directed update to the current GitLab role in `data/resume.yml`: retitled
  Senior→**Staff Fullstack Engineer, GitLab**, added `end: 2026-06-15` (owner laid
  off), rewrote its description. **v032** broadened the sanctioned owner-authored
  edit category to an item's factual fields (display name, start/end, description)
  and re-pinned the committed-snapshot SHA-256 (`d6c29374…→901ad39f…`). e2e
  re-pointed: the "missing end sorts as current" and "present-start/missing-end"
  examples now use still-open-ended Open-Source items (Fixture Builder) so those
  scenarios stay exercised. Deployed to production and verified live.

Historical pre-R2 state (retained for provenance):

- **Port done and green.** `src/**`, `data/resume.yml`, and the toolchain
  landed on `master` (`021b857 feat: implement phase-1 interactive and static
  resume`, plus follow-up `test(harness):` commits). `bun run check` is fully
  green with all gates ACTIVE over `src/**`: the SvelteKit + Vercel-adapter
  production build prerenders `/` and `/static`, coverage is 100% line/branch,
  property/fuzz is reproducible, all 36 scenarios resolve (24 browser-observable
  Playwright + 12 non-browser), and the Playwright e2e suite passes. Interactive
  and static surfaces render `data/resume.yml` to predecessor data/behavior
  parity (18 keys, 16 sections, 74 items). This satisfies MVP completion item 1
  and the local-build precondition — but NOT the live-deployment, redesign, or
  review items.

- **Delivery model redefined (spec head v026).** `SPECIFICATION/spec.md`
  §"Delivery phases" now defines the MVP as ported + redesigned + live + reviewed
  and moves AI/MCP to a separate later delivery; `constraints.md` §"Framework and
  deployment" now requires live deployment across all environment classes for MVP
  completion. The `phase 1` token is retained ("Phase 1 is the MVP"), so the
  guardrail gates and parity/identifier/scenario requirements are unaffected.

- **R1 live deployment — DONE (2026-07-10).** Dedicated Vercel project
  `thewoolleymans-projects/resume` created and linked; deploy token
  `resume-deploy` lives in the resume 1Password Environment (injected via
  `./with-resume-env.sh`; org/project ids also in `.vercel/project.json`).
  Production is live at `https://resume.thewoolleyweb.com` — Cloudflare `resume`
  CNAME re-pointed to `cname.vercel-dns.com` (DNS-only), Let's Encrypt cert
  issued, `/` and `/static` serve HTTP 200 and hydrate, `http`→`https` 308.
  Preview = Vercel branch deploys behind Vercel SSO (non-indexed). Development =
  local `vite dev`. Beads item closed with evidence. **Git↔Vercel integration is
  NOT yet connected** — deploys are currently CLI-driven (`vercel deploy
  --prod`); connecting the GitHub repo for true branch/PR previews + auto-deploy
  is an open, maintainer-authorizable follow-up.
  - **R2 visual redesign — MAINTAINER-DRIVEN (next ripe; beads li-ysz).** The
    maintainer performs a design pass with Claude Design on the running site,
    then the redesign is implemented under guardrail discipline preserving all
    behavioral scenarios and a11y/responsive requirements.
  - **R3/R4 redeploy + review.** Redeploy the redesigned site; the LLMs and the
    maintainer review the running Production site and sign off. (beads li-93c,
    li-88e; blocked-by R2/R3 respectively.)

- **Content changes landed (2026-07-10).** Owner-directed removal of the postal
  address from `header.contact` (live site now shows phone + email only),
  ratified as livespec **v027** (§"Governed data source" now permits recorded,
  re-pinned owner-directed PII redactions; retrieved-source hash retained,
  committed-snapshot SHA-256 re-pinned). The retired `cover-letter.thewoolleyweb.com`
  host was deleted from Cloudflare DNS (both the CNAME and its GitLab-Pages TXT;
  now NXDOMAIN); the underlying GitLab Pages project is separate hosting and was
  left intact. The About-text staleness is now ACTIONED in source: livespec
  **v029** sanctions owner-authored `about.content` edits (a new category
  alongside PII redaction; `about` carved out of textual parity — parity for it
  is now structural, not textual) and records the redesign is Claude-design-driven,
  and `data/resume.yml` `about.content` was rewritten to scrub the retired
  cover-letter link and the Vue/Nuxt/GitLab/Bootstrap self-description and describe
  the current SvelteKit/Vercel/GitHub stack with a brief 2019→2026 history note
  (committed-snapshot SHA-256 re-pinned `20600aea…→d6c29374…`; `bun run check`
  all-gates-ACTIVE green; committed as `6827433`). **This content is now LIVE** —
  see the production content-refresh redeploy below.

- **Production content-refresh redeploy (2026-07-10).** At the maintainer's
  request — release the current committed state before the design pass — the
  current `master` (`c66b235`) was redeployed to Vercel production via
  `./with-resume-env.sh bash -c 'vercel deploy --prod --yes --token "$VERCEL_TOKEN"'`
  and re-aliased to `https://resume.thewoolleyweb.com`. Verified live: `/` and
  `/static` serve HTTP 200, `http`→`https` 308, and the rewritten About (SvelteKit/
  Vercel/GitHub stack, stale Vue/Nuxt/cover-letter scrubbed) plus the phone+email
  contact redaction are both live. Git was already fully landed (`master ==
  origin/master`, clean tree) — this was a deploy only, no new commit. NOTE: this
  is a pre-redesign content refresh; it does NOT satisfy slice **R3**, which is the
  redeploy of the *redesigned* site after R2 lands.

- **Worktree-landing discipline (2026-07-10).** livespec **v028** reversed the
  direct-to-master sanction to worktree-mandatory (author/commit only in a dedicated
  secondary git worktree; land via PR auto-merge or a worktree fast-forward). The
  standalone Claude Code agent-session guards, the `AGENTS.md` "commit and land"
  rewrite, and `.claude/CLAUDE.md → AGENTS.md` (loads conventions into every
  session) all LANDED in `aa23d95`. The primary-checkout commit-refuse hook is
  now **ACTIVE** — `scripts/check-primary-checkout.ts` is wired into
  `.githooks/pre-commit` and verified by the `checkPrimaryCheckoutHook` gate in
  `bun run check`, so a commit authored in the primary checkout is refused and a
  bypassed/uninstalled hook fails the aggregate check. This closed the v028
  §"Hooks" gap tracked by **`plan/archive/worktree-guards/handoff.md`** (thread
  complete and archived). The v029 About
  fix above was landed by a maintainer-approved direct commit during the earlier
  transition window.

- **AI delivery relocated.** All AI-driven-mode and MCP planning now lives in
  `plan/ai/` (separate thread), not in `plan/mvp/`.

The work-item orchestrator is `livespec-orchestrator-beads-fabro`, backed by the
`resume` beads/Dolt tenant. Drive work through its operator loop — `drive` /
`plan` / `needs-attention` / `next` / `implement` / `capture-work-item`.

Next ripe action: **none for `plan/mvp/` — the MVP is COMPLETE and signed off.**
All of PORT + R1 + R2 + R3 + R4 are done; the maintainer signed off on the
running Production site on 2026-07-11; beads `li-88e` is closed and no work items
remain open. Every R4 finding (F1–F5) is resolved and verified live: F1
(interactive `<h1>`) + F2 (native-control `color-scheme`) in `fe90226`; F3
(per-route self-canonical) + F4 (`robots.txt`/`sitemap.xml`) + F5 (bullet markers
at the paragraph left edge) in `8ab0b3b`. The Terminal step is done (Production/
Preview verified against `constraints.md`; Preview non-indexed). The next
milestone is the separate **AI delivery** in **`plan/ai/`** (the `/ai` answering
behavior + the MCP server), which begins only when a future livespec
proposed change activates those surfaces and is held to the same
live-and-reviewed bar. To pick that up, drive from **`plan/ai/handoff.md`**, not
this thread.

## Resume

This thread (`plan/mvp/`) is **complete** — the MVP shipped and was signed off on
2026-07-11. Pasting this file's path again will just re-confirm completion.

The next milestone is the separate **AI delivery**. To drive it, paste this into
Claude Code or Codex:

```text
plan/ai/handoff.md
```
