// View helpers that keep the (unreachable-in-practice) Result unwrap out of the
// .svelte components so components stay branch-light and coverable. The
// composition never fails for well-formed governed items, but composeSection
// returns Result per the core discipline; composeOrOriginal unwraps it with a
// canonical-order fallback.
import type { ResumeItem } from "./data/types";

import { type ComposeControls, composeSection } from "./domain/compose";

export function composeOrOriginal(
  items: readonly ResumeItem[],
  controls: ComposeControls,
): readonly ResumeItem[] {
  const result = composeSection(items, controls);
  return result.ok ? result.value : items;
}

// Toggle a key in a set, returning a NEW set (so Svelte 5 $state reassignment
// triggers reactivity). Selecting/deselecting a skill-level checkbox.
export function toggleInSet(
  set: ReadonlySet<string>,
  key: string,
): Set<string> {
  const next = new Set(set);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  return next;
}
