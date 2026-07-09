// Route-load helper (SPECIFICATION/contracts.md §"Interactive rendering
// contract"). Under the phase-1 build-time load the governed data is read and
// transformed at prerender time; a malformed source is a domain failure that
// fails the build/prerender rather than shipping guessed data. This helper
// unwraps the Result and, on failure, raises a visitor-safe SvelteKit error
// derived from DomainError.kind via the presentation mapper (never a raw
// payload). It lives outside the core role dirs, so it returns the unwrapped
// value (throwing the framework error) rather than a Result.
import { error } from "@sveltejs/kit";

import type { ResumeData } from "./data/types";

import { loadResumeData } from "./data/resume";
import { presentError } from "./errors";

export function loadResumeOrError(): ResumeData {
  const result = loadResumeData();
  if (!result.ok) {
    // SvelteKit's error() returns an HttpError (not an Error subclass); throwing
    // it is the framework-idiomatic way to raise a visitor-safe failure.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw error(500, presentError(result.error));
  }
  return result.value;
}
