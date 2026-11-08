# AI-centric interactive resume

This `SPECIFICATION/` directory is the livespec source of truth for Chad Woolley's modern interactive resume app. The product is a standalone TypeScript successor to `../interactive-resume.gitlab.io`, deployed on Vercel at `resume.thewoolleyweb.com`, with interactive, static, AI-driven, and future MCP surfaces over governed resume data.

## Files

- `spec.md` describes product behavior and intent, including the governed resume data definition.
- `contracts.md` describes browser routes, data shapes, AI response records, future MCP contracts, and environment classes.
- `constraints.md` describes runtime, deployment, standalone, grounding, accessibility, performance, and safety constraints.
- `non-functional-requirements.md` describes the TypeScript-native development discipline inspired by the livespec fleet, including the contributor toolchain and repository command contracts.
- `scenarios.md` captures acceptance scenarios that must be mapped to end-to-end or integration tests as implementation proceeds.

## Functional vs. non-functional

This tree splits requirements as **product vs. process**, not the
textbook behavior-vs-quality split. `non-functional-requirements.md` is
the **only** non-functional file: it specifies how contributors build,
test, and maintain the app (toolchain, TDD, CI, quality gates). **Every
other file in this directory is functional** — `spec.md`,
`contracts.md`, `constraints.md`, and `scenarios.md` all specify the
delivered product, including its runtime, deployment, framework,
accessibility, and performance constraints.

Consequently, technology and framework choice, performance, and
accessibility are treated as **functional** requirements here (they
constrain the delivered product) and live in `constraints.md`, even
though a conventional taxonomy would label them "non-functional
qualities." The file named `non-functional-requirements.md` is the
authoritative definition of the category for this project; do not
override it with the generic meaning of the term.

## Governance

Changes to this specification flow through livespec propose-change and revise operations. Implementation work treats the accepted specification as authoritative. The project dogfoods the Codex driver and beads-fabro orchestrator while keeping the resume app standalone from the livespec fleet at runtime, in CI, and in deployment.
