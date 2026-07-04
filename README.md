# Chad Woolley's resume

See https://resume.thewoolleyweb.com for live version of resume.

## Development

The maintainer's resume application — a modern, AI-centric successor to
[interactive-resume.gitlab.io](https://gitlab.com/thewoolleyman/interactive-resume.gitlab.io)
(a Vue/Nuxt.js single-page interactive resume).

This is a real product AND a [livespec](https://github.com/thewoolleyman/livespec)
dogfooding exercise: the first **greenfield** livespec adopter (openbrain was the
first adopter, but brownfield — it existed before adopting the workflow). The app
will be built livespec-first: specification seeded via `/livespec:seed` before any
implementation exists, then factory-driven.

## Status

Registered as an adopter in livespec's fleet manifest
([`.livespec-fleet-manifest.jsonc`](https://github.com/thewoolleyman/livespec/blob/master/.livespec-fleet-manifest.jsonc),
profile `["baseline", "orchestrator-plugin", "app"]`, posture `pinned`).
Onboarding follows livespec's published end-user path —
[docs/installation.md](https://github.com/thewoolleyman/livespec/blob/master/docs/installation.md) —
executed from inside this repo, exactly as any greenfield adopter would:
enable the plugins via a committed `.claude/settings.json`, then run
`/livespec:seed` here (seed authors the spec tree AND writes
`.livespec.jsonc`). This bootstrap doubles as the live test of those
installation instructions; friction found here gets filed back against
livespec's `greenfield-install-experience` thread.
