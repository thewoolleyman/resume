// Skill-level definitions and pure level helpers (SPECIFICATION/contracts.md
// §"Skill-level filtering"). The five defined production levels plus the
// synthetic `unspecified` (how a no-level item behaves) drive the Skill Levels
// control and the item level indicator. A present item level is always one of
// the five defined keys — a present-but-non-defined value is malformed governed
// data rejected at load (§"Governed data source contract"), so there is no
// runtime invalid-level / `unknown level` state. This module is a util (not a
// core role dir), so these pure helpers return plain values; the filtering
// operation itself lives in the core domain layer and returns Result.

export interface SkillLevel {
  readonly key: string;
  readonly meaning: string;
}

// The five defined level keys, in canonical order. An item's stored level is
// one of these or null; this is the type an item's level narrows to.
export const DEFINED_LEVEL_KEYS = [
  "played",
  "once",
  "often",
  "toolbox",
  "teach",
] as const;

export type SkillLevelKey = (typeof DEFINED_LEVEL_KEYS)[number];

// Visitor-facing meanings for the defined keys, verbatim from the contract
// table. Total over SkillLevelKey so meaning lookups need no fallback branch.
const DEFINED_LEVEL_MEANINGS: Readonly<Record<SkillLevelKey, string>> = {
  played: "I have played around with it for fun",
  once: "I have used it on a single job or project",
  often: "I have used it on multiple jobs or projects",
  toolbox: "It's part of my toolbox; I use it daily",
  teach: "I know it in depth, I could teach a workshop or class on it",
};

// The six selectable filter keys with their explanations: the five defined
// keys plus `unspecified` (the sixth key — how a no-level item behaves for
// filtering; never an item's stored level value).
export const SKILL_LEVELS: readonly SkillLevel[] = [
  ...DEFINED_LEVEL_KEYS.map((key) => ({
    key,
    meaning: DEFINED_LEVEL_MEANINGS[key],
  })),
  { key: "unspecified", meaning: "Unspecified" },
];

export const ALL_LEVEL_KEYS: readonly string[] = [
  ...DEFINED_LEVEL_KEYS,
  "unspecified",
];

// Type guard: is `level` one of the five defined keys? Used at load to reject a
// present-but-non-defined level value as malformed governed data.
export function isDefinedLevel(level: string): level is SkillLevelKey {
  return (DEFINED_LEVEL_KEYS as readonly string[]).includes(level);
}

// An item with no level filters as `unspecified`.
export function effectiveLevel(level: SkillLevelKey | null): string {
  return level ?? "unspecified";
}

// The human-readable explanation for a defined level key. Total over the five
// keys: a present level is always defined (invalid levels are rejected at
// load), so there is no `unknown level` fallback branch.
export function levelMeaning(level: SkillLevelKey): string {
  return DEFINED_LEVEL_MEANINGS[level];
}
