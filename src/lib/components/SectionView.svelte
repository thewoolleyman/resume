<script lang="ts">
  import type { ResumeItem, ResumeSection } from "$lib/data/types";
  import type { SortOption } from "$lib/sort/section-sort";

  import { SORT_OPTIONS } from "$lib/sort/section-sort";

  import ItemRow from "./ItemRow.svelte";

  interface Props {
    section: ResumeSection;
    items: readonly ResumeItem[];
    collapsed: boolean;
    sort: string;
    onToggle: () => void;
    onSort: (value: string) => void;
    // Injection seam (defaults to the production sort options): a unit test can
    // supply a changing list to exercise the keyed-{#each} reconcile branches.
    sortOptions?: readonly SortOption[];
  }

  let {
    section,
    items,
    collapsed,
    sort,
    onToggle,
    onSort,
    sortOptions = SORT_OPTIONS,
  }: Props = $props();
</script>

<section class="section" aria-labelledby={`heading-${section.id}`}>
  <!-- Sticky-nav offset anchor: element id is the stable section slug. -->
  <span id={section.id} class="offset-anchor"></span>
  <div class="section-header">
    <button
      type="button"
      class="collapse-toggle"
      aria-expanded={!collapsed}
      aria-controls={`body-${section.id}`}
      onclick={onToggle}
    >
      <span aria-hidden="true">{collapsed ? "▸" : "▾"}</span>
      <span class="visually-hidden">
        {collapsed ? "Expand" : "Collapse"} section
      </span>
    </button>
    <h2 id={`heading-${section.id}`} class="section-name">{section.name}</h2>
    <label class="sort-control">
      <span>sort:</span>
      <select
        aria-label={`Sort ${section.name}`}
        value={sort}
        onchange={(event) => {
          onSort(event.currentTarget.value);
        }}
      >
        {#each sortOptions as option (option.id)}
          <option value={option.id}>{option.label}</option>
        {/each}
      </select>
    </label>
  </div>
  {#if !collapsed}
    <div class="section-body" id={`body-${section.id}`}>
      {#if items.length === 0}
        <p class="no-results" data-testid="no-results">
          No items match the current search and filters.
        </p>
      {:else}
        {#each items as item (item.id)}
          <ItemRow {item} />
        {/each}
      {/if}
    </div>
  {/if}
</section>

<style>
  .section {
    margin: 2rem 0;
  }
  .offset-anchor {
    display: block;
    /* Revealing a section via its hash must not leave the heading hidden
       under the sticky nav (SPECIFICATION/contracts.md §"Layout and controls"
       sticky-nav offset anchor). */
    scroll-margin-top: 5rem;
  }
  .section-header {
    display: flex;
    align-items: center;
    /* Wrap the sort control below the heading on narrow viewports so a long
       section name plus the sort <select> never forces horizontal page scroll
       (SPECIFICATION/scenarios.md "Navigation shell collapses responsively"). */
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.35rem 0 0.55rem;
    border-bottom: 1px solid var(--border-strong);
  }
  .section-name {
    flex: 1;
    /* Allow the heading to shrink and break long slash-joined tokens (e.g.
       "Languages/Libs/Frameworks") instead of overflowing its flex track. */
    min-width: 0;
    overflow-wrap: break-word;
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text);
  }
  .collapse-toggle {
    border: none;
    background: none;
    font-size: 0.85rem;
    line-height: 1;
    cursor: pointer;
    color: var(--text-muted);
    padding: 0.2rem 0.4rem;
    border-radius: var(--radius-sm);
  }
  .collapse-toggle:hover {
    color: var(--accent);
    background: var(--bg-subtle);
  }
  .sort-control {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: var(--text-faint);
  }
  .sort-control select {
    font: inherit;
    font-size: 0.8rem;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.4rem;
    cursor: pointer;
  }
  .no-results {
    color: var(--text-faint);
    padding: 0.85rem 0;
    font-style: italic;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
