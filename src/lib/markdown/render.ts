// Shared markdown renderer (SPECIFICATION/contracts.md §"Item rendering" →
// "Markdown rendering and sanitization"). Both interactive and static modes
// render governed markdown through THIS single configured renderer, so their
// output is byte-identical. The pinned production source uses headings,
// unordered lists, paragraphs, emphasis/strong, inline links, inline code
// spans, and bare-URL autolinks; GFM autolinking keeps trailing sentence
// punctuation outside the link target. Owner-authored raw HTML is preserved
// (not stripped) under the phase-1 trusted-source posture — marked does not
// sanitize by default. This is a core module, so its public API returns Result.
import { Marked } from "marked";

import type { DomainError } from "../errors";

import { ok, type Result } from "../result";

// A single shared, deterministically-configured renderer instance drives both
// modes. gfm enables bare-URL autolinks with predecessor-compatible trailing
// punctuation handling; async is disabled so parse() returns a string.
const markdownRenderer = new Marked({ gfm: true, breaks: false });

export function renderMarkdown(markdown: string): Result<string, DomainError> {
  const html = markdownRenderer.parse(markdown, { async: false });
  return ok(html);
}
