# resume

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
Onboarding — the `/livespec:seed` interview, `.livespec.jsonc`, credential
wrapper, GitHub App, beads tenant, and conformance wiring — is driven by the
`resume-adopter-onboarding` plan thread in the livespec repo.
