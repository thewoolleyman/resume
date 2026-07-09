// Typed Result / railway-oriented programming primitives per
// SPECIFICATION/non-functional-requirements.md §"Result and railway-oriented
// programming discipline". Expected domain failures travel the Result track as
// `Err<DomainError>`; thrown exceptions are reserved for bugs. This module is
// intentionally NOT under a core role dir (src/lib/{data,domain,search,sort,
// markdown}), so its helpers may return plain values rather than Result.

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export type AsyncResult<T, E> = Promise<Result<T, E>>;

export function ok<T>(value: T): { readonly ok: true; readonly value: T } {
  return { ok: true, value };
}

export function err<E>(error: E): { readonly ok: false; readonly error: E } {
  return { ok: false, error };
}

export function isOk<T, E>(
  result: Result<T, E>,
): result is { readonly ok: true; readonly value: T } {
  return result.ok;
}

export function isErr<T, E>(
  result: Result<T, E>,
): result is { readonly ok: false; readonly error: E } {
  return !result.ok;
}

export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  return result.ok ? result : err(fn(result.error));
}

export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

// Sequences a list of Results into a Result of a list, short-circuiting on the
// first Err in order — the deterministic "reject the whole source on the first
// malformed item" shape the governed-data transform relies on.
export function collect<T, E>(
  results: readonly Result<T, E>[],
): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }
  return ok(values);
}
