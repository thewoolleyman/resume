// Governed data source transform (SPECIFICATION/contracts.md §"Governed data
// source contract"): a pure, side-effect-free transform from the predecessor
// authoring shape (top-level `about`/`header` plus ordered section keys mapping
// to item arrays {name, level?, start?, end?, desc}) into the derived resume
// data contract. Malformed sources — a missing `about`/`header` group, a
// non-mapping root, an invalid section, or a section item lacking a display
// name — are rejected as domain failures rather than rendered as partial or
// guessed data. This is a core module, so it returns Result; YAML is parsed
// with parseDocument (which collects syntax errors rather than throwing), so
// no catch is needed on the Result track. Infallible Result-returning steps
// (markdown render, slug derivation) are threaded with map/andThen so this
// module has no unreachable error branches.
import { parseDocument } from "yaml";

import type { DomainError } from "../errors";
import type {
  ResumeData,
  ResumeItem,
  ResumeProfile,
  ResumeSection,
} from "./types";

import { renderMarkdown } from "../markdown/render";
import { andThen, err, map, ok, type Result } from "../result";
import { buildSearchText } from "../search/projection";
import { isDefinedLevel, type SkillLevelKey } from "../skill-levels";
import { deriveDateFields } from "./dates";
import { deriveItemIds, deriveSectionSlugs, type ItemKey } from "./slugs";

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

// An optional string field (level, desc): absent or explicit null -> null; a
// present value of the wrong type is malformed and rejected rather than
// silently coerced.
function readOptionalString(
  item: Record<string, unknown>,
  key: string,
  section: string,
  index: number,
): Result<string | null, DomainError> {
  if (!(key in item)) {
    return ok(null);
  }
  const raw = item[key];
  if (raw === null) {
    return ok(null);
  }
  if (typeof raw === "string") {
    return ok(raw);
  }
  return err({
    kind: "invalid-item",
    section,
    index,
    detail: `${key} must be a string`,
  });
}

// An optional date field (start, end): absent or explicit null -> null; a
// present ISO-8601 string is kept verbatim (validated later at parse time).
// The YAML 1.2 core schema resolves date-shaped scalars as strings, so any
// present non-string value is a malformed date scalar and is rejected rather
// than coerced to "missing".
function readOptionalDate(
  item: Record<string, unknown>,
  key: string,
  section: string,
  index: number,
): Result<string | null, DomainError> {
  if (!(key in item)) {
    return ok(null);
  }
  const raw = item[key];
  if (raw === null) {
    return ok(null);
  }
  if (typeof raw === "string") {
    return ok(raw);
  }
  return err({
    kind: "invalid-date",
    field: `${section}[${String(index)}].${key}`,
    value: `non-string:${typeof raw}`,
  });
}

interface RawItem {
  readonly sectionName: string;
  readonly title: string;
  readonly level: SkillLevelKey | null;
  readonly start: string | null;
  readonly end: string | null;
  readonly descriptionMarkdown: string;
}

function parseProfile(
  root: Record<string, unknown>,
): Result<ResumeProfile, DomainError> {
  if (!("about" in root)) {
    return err({ kind: "missing-about" });
  }
  if (!("header" in root)) {
    return err({ kind: "missing-header" });
  }
  const about = asObject(root["about"]);
  if (about === null) {
    return err({ kind: "invalid-about", detail: "about is not a mapping" });
  }
  const aboutTitle = asString(about["title"]);
  const aboutContent = asString(about["content"]);
  if (aboutTitle === null || aboutContent === null) {
    return err({
      kind: "invalid-about",
      detail: "about.title and about.content must be strings",
    });
  }
  const header = asObject(root["header"]);
  if (header === null) {
    return err({ kind: "invalid-header", detail: "header is not a mapping" });
  }
  const name = asString(header["name"]);
  const contact = asString(header["contact"]);
  if (name === null || contact === null) {
    return err({
      kind: "invalid-header",
      detail: "header.name and header.contact must be strings",
    });
  }
  return map(renderMarkdown(aboutContent), (aboutHtml) => ({
    about: {
      title: aboutTitle,
      contentMarkdown: aboutContent,
      contentHtml: aboutHtml,
    },
    header: { name, contact },
  }));
}

function parseRawItems(
  root: Record<string, unknown>,
  sectionNames: readonly string[],
): Result<RawItem[], DomainError> {
  const rawItems: RawItem[] = [];
  for (const sectionName of sectionNames) {
    const value = root[sectionName];
    if (!Array.isArray(value)) {
      return err({
        kind: "invalid-section",
        section: sectionName,
        detail: "section value must be an array of items",
      });
    }
    for (let index = 0; index < value.length; index += 1) {
      const item = asObject(value[index]);
      if (item === null) {
        return err({
          kind: "invalid-item",
          section: sectionName,
          index,
          detail: "item must be a mapping",
        });
      }
      const title = asString(item["name"]);
      if (title === null || title.trim().length === 0) {
        return err({ kind: "nameless-item", section: sectionName, index });
      }
      const level = readOptionalString(item, "level", sectionName, index);
      if (!level.ok) {
        return level;
      }
      // A present level MUST be one of the five defined keys; a
      // present-but-non-defined value is malformed governed data rejected at
      // load (SPECIFICATION/contracts.md §"Skill-level filtering"), not
      // tolerated as an `unknown level` at runtime.
      const levelValue = level.value;
      if (levelValue !== null && !isDefinedLevel(levelValue)) {
        return err({
          kind: "invalid-level",
          section: sectionName,
          index,
          value: levelValue,
        });
      }
      const start = readOptionalDate(item, "start", sectionName, index);
      if (!start.ok) {
        return start;
      }
      const end = readOptionalDate(item, "end", sectionName, index);
      if (!end.ok) {
        return end;
      }
      const desc = readOptionalString(item, "desc", sectionName, index);
      if (!desc.ok) {
        return desc;
      }
      rawItems.push({
        sectionName,
        title,
        level: levelValue,
        start: start.value,
        end: end.value,
        descriptionMarkdown: desc.value ?? "",
      });
    }
  }
  return ok(rawItems);
}

function buildItem(raw: RawItem, id: string): Result<ResumeItem, DomainError> {
  return andThen(deriveDateFields(raw.start, raw.end), (dates) =>
    andThen(renderMarkdown(raw.descriptionMarkdown), (descriptionHtml) =>
      map(
        buildSearchText(raw.title, raw.descriptionMarkdown),
        (searchText) => ({
          id,
          title: raw.title,
          level: raw.level,
          start: raw.start,
          end: raw.end,
          startDisplay: dates.startDisplay,
          endDisplay: dates.endDisplay,
          startSortKey: dates.startSortKey,
          endSortKey: dates.endSortKey,
          descriptionMarkdown: raw.descriptionMarkdown,
          descriptionHtml,
          searchText,
        }),
      ),
    ),
  );
}

function assemble(
  profile: ResumeProfile,
  sectionNames: readonly string[],
  sectionSlugs: readonly string[],
  rawItems: readonly RawItem[],
  itemIds: readonly string[],
): Result<ResumeData, DomainError> {
  const items: ResumeItem[] = [];
  for (let i = 0; i < rawItems.length; i += 1) {
    const built = buildItem(rawItems[i] as RawItem, itemIds[i] as string);
    if (!built.ok) {
      return built;
    }
    items.push(built.value);
  }
  const sections: ResumeSection[] = sectionNames.map((name, sectionIndex) => ({
    id: sectionSlugs[sectionIndex] as string,
    ordinal: sectionIndex + 1,
    name,
    items: items.filter(
      (_, itemIndex) => (rawItems[itemIndex] as RawItem).sectionName === name,
    ),
  }));
  return ok({
    profile,
    sections,
    items,
    skills: [],
    relationships: [],
    metadata: {
      sectionCount: sections.length,
      itemCount: items.length,
      topLevelKeyCount: sectionNames.length + 2,
    },
  });
}

export function transformResume(
  yamlText: string,
): Result<ResumeData, DomainError> {
  const document = parseDocument(yamlText);
  if (document.errors.length > 0) {
    return err({
      kind: "yaml-parse",
      detail: document.errors.map((error) => error.message).join("; "),
    });
  }
  const root = asObject(document.toJS() as unknown);
  if (root === null) {
    return err({
      kind: "not-a-mapping",
      detail: "governed source root must be a mapping",
    });
  }
  const sectionNames = Object.keys(root).filter(
    (key) => key !== "about" && key !== "header",
  );
  return andThen(parseProfile(root), (profile) =>
    andThen(parseRawItems(root, sectionNames), (rawItems) => {
      const keys: ItemKey[] = rawItems.map((raw) => ({
        sectionName: raw.sectionName,
        itemName: raw.title,
      }));
      return andThen(deriveSectionSlugs(sectionNames), (sectionSlugs) =>
        andThen(deriveItemIds(keys), (itemIds) =>
          assemble(profile, sectionNames, sectionSlugs, rawItems, itemIds),
        ),
      );
    }),
  );
}
