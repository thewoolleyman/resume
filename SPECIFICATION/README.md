# AI-centric interactive resume

This `SPECIFICATION/` directory is the livespec source of truth for Chad Woolley's modern interactive resume app. The product is a standalone TypeScript successor to `../interactive-resume.gitlab.io`, deployed on Vercel at `resume.thewoolleyweb.com`, with interactive, static, AI-driven, and future MCP surfaces over governed resume data.

## Files

- `spec.md` describes product behavior and the livespec-first project intent.
- `contracts.md` describes browser routes, data shapes, AI response records, future MCP contracts, environment classes, and repository command contracts.
- `constraints.md` describes runtime, deployment, standalone, grounding, accessibility, performance, and safety constraints.
- `non-functional-requirements.md` describes the TypeScript-native development discipline inspired by the livespec fleet.
- `scenarios.md` captures acceptance scenarios that must be mapped to end-to-end or integration tests as implementation proceeds.

## Governance

Changes to this specification flow through livespec propose-change and revise operations. Implementation work treats the accepted specification as authoritative. The project dogfoods the Codex driver and git-jsonl orchestrator while keeping the resume app standalone from the livespec fleet at runtime, in CI, and in deployment.
