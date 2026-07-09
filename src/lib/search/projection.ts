// DOM-free plain-text projection for interactive search
// (SPECIFICATION/contracts.md §"Search"; scenario "Search projection is
// generated without a browser DOM"). Search must operate over item display
// names plus the plain-text form of markdown descriptions, and MUST NOT match
// markdown syntax or HTML tags. The projection renders the markdown through the
// shared renderer, then strips tags (removing their attributes — including link
// target URLs, so a URL that appears only inside `[text](url)` is not
// searchable) and decodes entities, all without any `document`/`window`
// dependency so it runs during server-side and build-time rendering.
import type { DomainError } from "../errors";

import { renderMarkdown } from "../markdown/render";
import { map, type Result } from "../result";

// Decodes the small set of HTML entities the markdown renderer emits. `&amp;`
// is decoded last so an already-escaped ampersand is not double-decoded.
function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function stripHtml(html: string): string {
  const withoutTags = html.replace(/<[^>]*>/g, " ");
  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

// Projects a markdown string to searchable plain text. The rendered HTML is a
// pure function of the input (no DOM), and tag stripping/entity decoding are
// string operations, so the whole projection is DOM-free.
export function projectSearchText(
  markdown: string,
): Result<string, DomainError> {
  return map(renderMarkdown(markdown), stripHtml);
}

// Builds the full search haystack for an item: its display name plus the
// projected plain text of its markdown description.
export function buildSearchText(
  title: string,
  descriptionMarkdown: string,
): Result<string, DomainError> {
  return map(
    projectSearchText(descriptionMarkdown),
    (projected) => `${title}\n${projected}`,
  );
}
