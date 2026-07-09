<script lang="ts">
  import type { ResumeItem } from "$lib/data/types";

  import LevelBadge from "./LevelBadge.svelte";

  interface Props {
    item: ResumeItem;
  }

  let { item }: Props = $props();
</script>

<article class="item" id={item.id} data-testid="item">
  <div class="item-name">
    <span class="item-title">{item.title}</span>
    <LevelBadge level={item.level} />
  </div>
  <div class="item-dates">
    <span class="date-start">{item.startDisplay}</span>
    <span class="date-end">{item.endDisplay}</span>
  </div>
  <!-- Governed markdown is rendered once at build time and is owner-authored
       (trusted) per SPECIFICATION/contracts.md §"Item rendering". -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <div class="item-desc">{@html item.descriptionHtml}</div>
</article>

<style>
  .item {
    display: grid;
    grid-template-columns: minmax(11rem, 18rem) 7rem 1fr;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-top: 1px solid #ececf2;
    /* A hash-revealed item must not be hidden under the sticky nav
       (SPECIFICATION/contracts.md §"Interactive rendering contract"). */
    scroll-margin-top: 5rem;
  }
  .item-title {
    font-weight: 600;
  }
  .item-desc {
    /* Long unbreakable tokens (bare URLs, inline code) must wrap rather than
       force horizontal page scroll on narrow viewports
       (SPECIFICATION/scenarios.md "Navigation shell collapses responsively"). */
    min-width: 0;
    overflow-wrap: break-word;
  }
  .item-dates {
    color: #555;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .date-end {
    margin-left: 0.25rem;
  }
  .item-desc :global(p:first-child) {
    margin-top: 0;
  }
  @media (max-width: 720px) {
    .item {
      grid-template-columns: 1fr;
      gap: 0.25rem;
    }
  }
</style>
