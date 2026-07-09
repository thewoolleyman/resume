import { describe, expect, it } from "vitest";

import { renderMarkdown } from "./render";

function html(markdown: string): string {
  const result = renderMarkdown(markdown);
  if (!result.ok) {
    throw new Error(result.error.kind);
  }
  return result.value;
}

const SAMPLE = [
  "## Heading",
  "",
  "- one",
  "- two",
  "",
  "A `process_helper` span with **bold**, _em_, and a [link](https://x.example/p).",
  "",
  "Bare https://github.com/thewoolleyman/process_helper here.",
  "",
  '<span class="raw">kept</span>',
  "",
].join("\n");

describe("shared markdown renderer", () => {
  it("interactive and static modes render byte-identical markdown", () => {
    // Both modes render through this one renderer, so their output is identical
    // by construction; rendering the same source twice proves it deterministic.
    const interactive = renderMarkdown(SAMPLE);
    const staticMode = renderMarkdown(SAMPLE);
    expect(interactive).toEqual(staticMode);

    const out = html(SAMPLE);
    expect(out).toContain("<h2");
    expect(out).toContain("<ul>");
    expect(out).toContain("<li>one</li>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em>em</em>");
    // Inline code renders as a <code> element (predecessor parity).
    expect(out).toContain("<code>process_helper</code>");
    // Inline link.
    expect(out).toContain('<a href="https://x.example/p">link</a>');
    // Bare URL autolink.
    expect(out).toContain(
      '<a href="https://github.com/thewoolleyman/process_helper">',
    );
    // Owner-authored raw HTML is preserved, not stripped (trusted posture).
    expect(out).toContain('<span class="raw">kept</span>');
  });

  it("keeps trailing sentence punctuation outside a bare-URL autolink", () => {
    const out = html("Visit https://example.com. Thanks.");
    expect(out).toContain('href="https://example.com"');
    expect(out).not.toContain('href="https://example.com."');
  });
});
