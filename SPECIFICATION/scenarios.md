# AI-centric interactive resume - scenarios

## Scenario: Visitor opens the interactive resume

Given the production site has governed resume data

When a visitor opens `https://resume.thewoolleyweb.com/`

Then the visitor sees the interactive resume with profile information, section navigation, and resume items rendered from the governed data

## Scenario: Visitor navigates to a stable resume item

Given a resume item has a stable identifier

When a visitor opens a URL that targets that item

Then the app reveals the matching item after data loading completes

## Scenario: Visitor renders the static resume

Given the governed resume data contains multiple resume sections

When a visitor opens static resume mode

Then all governed resume data is visible in traditional resume order without requiring search, filters, chat, hover, or JavaScript-only disclosure

## Scenario: Visitor asks an answerable AI question

Given the governed resume data contains facts relevant to a visitor's question

When the visitor asks that question in AI-driven mode

Then the app returns a grounded answer with citations to the supporting resume data

## Scenario: Visitor asks an unanswerable AI question

Given the governed resume data does not contain the requested fact

When the visitor asks for that fact in AI-driven mode

Then the app states that the resume data does not contain the answer and does not invent a fact

## Scenario: AI provider failure does not break the resume

Given the AI provider is unavailable or misconfigured

When a visitor opens interactive or static resume mode

Then the resume still renders without requiring AI mode to succeed

## Scenario: Preview deployment validates a pull request

Given a pull request changes product behavior

When CI and Vercel preview checks run

Then the aggregate check passes and the preview deployment renders the changed resume app before merge

## Scenario: Future MCP client reads governed resume data

Given MCP support has been implemented

When an MCP client requests the structured resume data resource or tool

Then the server returns governed resume data without exposing secrets, local files, or ungoverned memory
