---
topic: seed
author: livespec-seed
---

## Proposal: seed

### Target specification files

- SPECIFICATION/spec.md
- SPECIFICATION/contracts.md
- SPECIFICATION/constraints.md
- SPECIFICATION/non-functional-requirements.md
- SPECIFICATION/scenarios.md
- SPECIFICATION/README.md

### Summary

Initial seed of the specification from user-provided intent.

### Motivation

@livespec:seed inputs for the seed:  

1. This is a modern implementation of the ../interactive-resume.gitlab.io project. Same concept and basic UI (a single-page-app interactive, but with the option to render to a traditional static resume with all data).  But will also add a third "AI-driven" mode which is just a chat box to ask questions about me. Also it will eventually expose an MCP server.

2. As the README says, it is to dogfood a greenfield livespec app, using codex driver and git-jsonl orchestrator. 

3. There are many standardized
  practices that should be adopted from the livespec fleet and ecosystem (also all its repos live as peers on this filesystem).  E.g., the TDD discipline, the livespec-dev-tooling shared guidelines, all the ecosystem tooling and discipline from the livespec family that are applicable, 
  the github CI workflow for pull request discipine, release discipline, the top-of-pyramid discipline to ensure that all scenarios have a E2E test, linting, fuzzing, the hooks to guard against persisting any local memories and instead force to .ai/*.md referenced from AGENTS.md.
   Basically all the  discipline dials turned up to 11. BUT THERE SHOULD BE NO DEPENDENCIES ON ANY OF THIS - THE APP MUST BE COMPLETELY STANDALONE. All of these are captured in the specification nonfunctional requirements doc. 

4. It will be implemented in Typescript, whereas livespec is implemented in python (all the repos except the console) and rust (only livespec-console-beads-fabro). So all the discpline and dev-tooling from above should INSPIRE the SAME APPROACHES in the typescript ecosystem, using
   all TS/JS best practices (bun, vitest, playwright, etc. etc.). 

5. The app will be deployed to vercel, and will leverage it wherever possible.

6. The prod url will be resume.thewoolleyweb.com.  There will also be vercel preview and development environments. 


### Proposed Changes

@livespec:seed inputs for the seed:  

1. This is a modern implementation of the ../interactive-resume.gitlab.io project. Same concept and basic UI (a single-page-app interactive, but with the option to render to a traditional static resume with all data).  But will also add a third "AI-driven" mode which is just a chat box to ask questions about me. Also it will eventually expose an MCP server.

2. As the README says, it is to dogfood a greenfield livespec app, using codex driver and git-jsonl orchestrator. 

3. There are many standardized
  practices that should be adopted from the livespec fleet and ecosystem (also all its repos live as peers on this filesystem).  E.g., the TDD discipline, the livespec-dev-tooling shared guidelines, all the ecosystem tooling and discipline from the livespec family that are applicable, 
  the github CI workflow for pull request discipine, release discipline, the top-of-pyramid discipline to ensure that all scenarios have a E2E test, linting, fuzzing, the hooks to guard against persisting any local memories and instead force to .ai/*.md referenced from AGENTS.md.
   Basically all the  discipline dials turned up to 11. BUT THERE SHOULD BE NO DEPENDENCIES ON ANY OF THIS - THE APP MUST BE COMPLETELY STANDALONE. All of these are captured in the specification nonfunctional requirements doc. 

4. It will be implemented in Typescript, whereas livespec is implemented in python (all the repos except the console) and rust (only livespec-console-beads-fabro). So all the discpline and dev-tooling from above should INSPIRE the SAME APPROACHES in the typescript ecosystem, using
   all TS/JS best practices (bun, vitest, playwright, etc. etc.). 

5. The app will be deployed to vercel, and will leverage it wherever possible.

6. The prod url will be resume.thewoolleyweb.com.  There will also be vercel preview and development environments. 

