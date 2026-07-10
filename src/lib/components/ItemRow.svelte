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
    grid-template-columns: minmax(10rem, 19rem) 8.5rem 1fr;
    gap: 1rem;
    padding: 1rem 0;
    border-top: 1px solid var(--border);
    /* A hash-revealed item must not be hidden under the sticky nav
       (SPECIFICATION/contracts.md §"Interactive rendering contract"). */
    scroll-margin-top: 5rem;
  }
  .item-name {
    line-height: 1.45;
  }
  .item-title {
    font-weight: 600;
    color: var(--text);
  }
  .item-desc {
    /* Long unbreakable tokens (bare URLs, inline code) must wrap rather than
       force horizontal page scroll on narrow viewports
       (SPECIFICATION/scenarios.md "Navigation shell collapses responsively"). */
    min-width: 0;
    overflow-wrap: break-word;
    color: var(--text-muted);
  }
  .item-dates {
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    padding-top: 0.15rem;
  }
  .date-end {
    margin-left: 0.25rem;
  }
  .item-desc :global(p:first-child) {
    margin-top: 0;
  }
  .item-desc :global(p:last-child) {
    margin-bottom: 0;
  }
  .item-desc :global(a) {
    text-decoration: underline;
  }
  .item-desc :global(code) {
    font-family: var(--font-mono);
    font-size: 0.85em;
    background: var(--bg-subtle);
    padding: 0.1em 0.35em;
    border-radius: var(--radius-sm);
  }
  .item-desc :global(h2),
  .item-desc :global(h3),
  .item-desc :global(h4) {
    font-size: 1rem;
    font-weight: 600;
    margin: 0.85rem 0 0.3rem;
    letter-spacing: -0.01em;
  }
  @media (max-width: 720px) {
    .item {
      grid-template-columns: 1fr;
      gap: 0.3rem;
    }
  }
</style>
