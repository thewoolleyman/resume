// Test-only reactive props holder. Wraps an object in `$state` so that a
// component mounted with it (via svelte's `mount`) observes later mutations to
// the props, letting a unit test drive Svelte's keyed-`{#each}` reconciliation
// (update/move/remove) branches over collections that never change in
// production (SORT_OPTIONS, SKILL_LEVELS). Per
// SPECIFICATION/non-functional-requirements.md §"Test coverage expectations",
// an injection seam exercised only by tests is a legitimate means to the 100%
// coverage floor. This module is test infrastructure under `__fixtures__/`,
// excluded from coverage by vite.config.ts.
export function reactiveProps<T extends object>(initial: T): T {
  const props = $state(initial);
  return props;
}
