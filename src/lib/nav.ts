// Hash / deep-link resolution for interactive navigation
// (SPECIFICATION/contracts.md §"Layout and controls" and §"Interactive
// rendering contract" hash-reveal). Resolves a URL hash to the element id to
// reveal, honoring the legacy `#list-<ordinal>` section aliases (ordinal is the
// 1-based governed position) and treating a hash that targets no existing
// anchor as a no-op (null). Pure util; returns plain values.
import type { ResumeSection } from "./data/types";

export function resolveAnchor(
  hash: string,
  sections: readonly ResumeSection[],
): string | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (raw.length === 0) {
    return null;
  }
  const legacy = /^list-(\d+)$/.exec(raw);
  if (legacy !== null) {
    const ordinal = Number(legacy[1]);
    const section = sections.find((entry) => entry.ordinal === ordinal);
    return section?.id ?? null;
  }
  if (sections.some((section) => section.id === raw)) {
    return raw;
  }
  if (
    sections.some((section) => section.items.some((item) => item.id === raw))
  ) {
    return raw;
  }
  return null;
}

// Reveals the anchor targeted by a URL hash by scrolling its element into view
// (the section offset anchor or item element). Returns whether a target was
// revealed; a missing/unknown anchor is a no-op. The document is injected so
// the whole reveal is testable without a real browser.
export function revealAnchor(
  hash: string,
  sections: readonly ResumeSection[],
  doc: Pick<Document, "getElementById">,
): boolean {
  const target = resolveAnchor(hash, sections);
  if (target === null) {
    return false;
  }
  const element = doc.getElementById(target);
  if (element === null) {
    return false;
  }
  element.scrollIntoView();
  return true;
}
