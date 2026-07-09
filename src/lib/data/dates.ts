// Date parsing, predecessor-format rendering, and sort keys
// (SPECIFICATION/contracts.md §"Item rendering" and §"Per-section sorting").
// Dates are ISO-8601 calendar dates (YYYY-MM-DD, optionally with a time
// component) interpreted in UTC. This is a core module, so its public API
// returns Result; a present-but-unparseable date is a domain failure that
// fails the build/prerender rather than rendering guessed data.
import type { DomainError } from "../errors";

import { err, ok, type Result } from "../result";

// Missing start sorts as the earliest instant; missing end sorts as "current"
// (a far-future instant). Finite sentinels well outside the real Date range
// keep the keys plainly JSON-serializable through the prerender payload.
export const MISSING_START_SORT_KEY = Number.MIN_SAFE_INTEGER;
export const MISSING_END_SORT_KEY = Number.MAX_SAFE_INTEGER;

// The predecessor start/end separator is a non-breaking space + hyphen
// (&nbsp;-). Pinned as an explicit escape so the parity-critical NBSP cannot be
// silently replaced by an ordinary space (SPECIFICATION/scenarios.md
// "Item dates render in predecessor format").
export const NBSP = "\u00A0";

// Non-zero-padded month + four-digit year, matching the predecessor (e.g.
// 2006-04-15 -> "4.2006").
function formatMonthYear(date: Date): string {
  return `${String(date.getUTCMonth() + 1)}.${String(date.getUTCFullYear())}`;
}

export function parseIsoDate(
  field: string,
  value: string,
): Result<Date, DomainError> {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?Z?$/.exec(
      value,
    );
  if (match === null) {
    return err({ kind: "invalid-date", field, value });
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] === undefined ? 0 : Number(match[4]);
  const minute = match[5] === undefined ? 0 : Number(match[5]);
  const second = match[6] === undefined ? 0 : Number(match[6]);
  if (month < 1 || month > 12) {
    return err({ kind: "invalid-date", field, value });
  }
  if (day < 1 || day > 31) {
    return err({ kind: "invalid-date", field, value });
  }
  if (hour > 23 || minute > 59 || second > 59) {
    return err({ kind: "invalid-date", field, value });
  }
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  // A day that overflows its month (e.g. Feb 30, Apr 31) rolls into the next
  // month, so getUTCDate no longer matches the requested day.
  if (date.getUTCDate() !== day) {
    return err({ kind: "invalid-date", field, value });
  }
  return ok(date);
}

export interface DateFields {
  readonly startDisplay: string;
  readonly endDisplay: string;
  readonly startSortKey: number;
  readonly endSortKey: number;
}

// Parses start/end once each and derives the predecessor two-position date
// column plus the sort keys across all four presence combinations
// (SPECIFICATION/contracts.md §"Item rendering" table). A present-but-invalid
// date scalar is a domain failure.
export function deriveDateFields(
  start: string | null,
  end: string | null,
): Result<DateFields, DomainError> {
  let startDate: Date | null = null;
  if (start !== null) {
    const parsed = parseIsoDate("start", start);
    if (!parsed.ok) {
      return parsed;
    }
    startDate = parsed.value;
  }
  let endDate: Date | null = null;
  if (end !== null) {
    const parsed = parseIsoDate("end", end);
    if (!parsed.ok) {
      return parsed;
    }
    endDate = parsed.value;
  }
  const startDisplay =
    startDate !== null
      ? `${formatMonthYear(startDate)}${NBSP}-`
      : endDate !== null
        ? "until"
        : "";
  const endDisplay = endDate !== null ? formatMonthYear(endDate) : "current";
  const startSortKey =
    startDate !== null ? startDate.getTime() : MISSING_START_SORT_KEY;
  const endSortKey =
    endDate !== null ? endDate.getTime() : MISSING_END_SORT_KEY;
  return ok({ startDisplay, endDisplay, startSortKey, endSortKey });
}
