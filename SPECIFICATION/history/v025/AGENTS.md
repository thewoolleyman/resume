# AGENTS.md — SPECIFICATION/

Before reading, editing, or reasoning about any file in this directory,
read `SPECIFICATION/README.md` first. It defines the layout of the
livespec source of truth: what each file covers and, critically, how
this project draws the **functional vs. non-functional** line.

Key point that is easy to get wrong: the split here is **product vs.
process**, not the textbook behavior-vs-quality split.
`non-functional-requirements.md` is the ONLY non-functional file; every
other file (`spec.md`, `contracts.md`, `constraints.md`,
`scenarios.md`) is **functional** and specifies the delivered product —
including runtime, deployment, framework, accessibility, and
performance constraints. Derive the taxonomy from the README, not from
the generic meaning of "non-functional."

For repo-wide agent conventions (commit/land behavior, etc.), see the
root `../AGENTS.md`.
