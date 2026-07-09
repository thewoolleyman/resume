// Domain error taxonomy and the visitor-safe presentation mapper per
// SPECIFICATION/non-functional-requirements.md §"Result and railway-oriented
// programming discipline" and SPECIFICATION/contracts.md §"Error payloads".
// DomainError is a discriminated union with stable `kind` strings and
// structured, non-secret context; user-facing text derives from `kind` alone
// through presentError so no detail, path, or raw payload leaks to visitors.
// This module is not under a core role dir, so presentError may return a plain
// string.

export type DomainError =
  | { readonly kind: "yaml-parse"; readonly detail: string }
  | { readonly kind: "not-a-mapping"; readonly detail: string }
  | { readonly kind: "missing-about" }
  | { readonly kind: "missing-header" }
  | { readonly kind: "invalid-about"; readonly detail: string }
  | { readonly kind: "invalid-header"; readonly detail: string }
  | {
      readonly kind: "invalid-section";
      readonly section: string;
      readonly detail: string;
    }
  | {
      readonly kind: "nameless-item";
      readonly section: string;
      readonly index: number;
    }
  | {
      readonly kind: "invalid-item";
      readonly section: string;
      readonly index: number;
      readonly detail: string;
    }
  | {
      readonly kind: "invalid-level";
      readonly section: string;
      readonly index: number;
      readonly value: string;
    }
  | {
      readonly kind: "invalid-date";
      readonly field: string;
      readonly value: string;
    }
  | { readonly kind: "markdown-render"; readonly detail: string };

// Visitor-safe message derived only from the stable `kind`. It intentionally
// omits every structured detail (section names, indexes, raw values, parser
// output) so nothing sensitive or diagnostic reaches a visitor.
export function presentError(error: DomainError): string {
  switch (error.kind) {
    case "yaml-parse":
    case "not-a-mapping":
      return "The résumé data could not be read because its source is not valid.";
    case "missing-about":
    case "missing-header":
      return "The résumé data is incomplete and cannot be displayed.";
    case "invalid-about":
    case "invalid-header":
    case "invalid-section":
    case "invalid-item":
    case "invalid-level":
      return "The résumé data is malformed and cannot be displayed.";
    case "nameless-item":
      return "The résumé data contains an item with no name and cannot be displayed.";
    case "invalid-date":
      return "The résumé data contains an invalid date and cannot be displayed.";
    case "markdown-render":
      return "The résumé content could not be rendered.";
  }
}
