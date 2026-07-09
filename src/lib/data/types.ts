// The derived resume data contract (SPECIFICATION/contracts.md §"Resume data
// contract") that the authoring-shape source is transformed into at load time.
// Dates, markdown, and the DOM-free search projection are derived once at
// build/prerender time and baked onto each item so runtime rendering and
// search need no re-parsing.

import type { SkillLevelKey } from "../skill-levels";

export interface AboutData {
  readonly title: string;
  readonly contentMarkdown: string;
  readonly contentHtml: string;
}

export interface HeaderData {
  readonly name: string;
  readonly contact: string;
}

export interface ResumeProfile {
  readonly about: AboutData;
  readonly header: HeaderData;
}

export interface ResumeItem {
  // Stable, public, deep-linkable anchor: <section-slug>-<title-slug>[-N].
  readonly id: string;
  readonly title: string;
  // Predecessor level key (one of the five defined keys), or null when the
  // item carries no level. A present-but-non-defined value is rejected at load.
  readonly level: SkillLevelKey | null;
  // Raw ISO-8601 date scalars (or null), retained for provenance/debugging.
  readonly start: string | null;
  readonly end: string | null;
  // Predecessor two-position date column, rendered at build time.
  readonly startDisplay: string;
  readonly endDisplay: string;
  // Sort keys: missing start orders earliest, missing end orders as current.
  readonly startSortKey: number;
  readonly endSortKey: number;
  readonly descriptionMarkdown: string;
  readonly descriptionHtml: string;
  // DOM-free plain-text projection of title + description used by search.
  readonly searchText: string;
}

export interface ResumeSection {
  // Stable section slug — the canonical anchor and Contents link target.
  readonly id: string;
  // 1-based position in governed data order (legacy #list-<ordinal> alias).
  readonly ordinal: number;
  readonly name: string;
  readonly items: readonly ResumeItem[];
}

export interface ResumeMetadata {
  readonly sectionCount: number;
  readonly itemCount: number;
  readonly topLevelKeyCount: number;
}

export interface ResumeData {
  readonly profile: ResumeProfile;
  readonly sections: readonly ResumeSection[];
  readonly items: readonly ResumeItem[];
  // Deferred forward-looking collections — always empty in phase 1.
  readonly skills: readonly never[];
  readonly relationships: readonly never[];
  readonly metadata: ResumeMetadata;
}
