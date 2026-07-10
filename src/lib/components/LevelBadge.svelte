<script lang="ts">
  import type { SkillLevelKey } from "$lib/skill-levels";

  import { levelMeaning } from "$lib/skill-levels";

  interface Props {
    level: SkillLevelKey | null;
  }

  let { level }: Props = $props();
</script>

{#if level !== null}
  <abbr class="level-badge" title={levelMeaning(level)}>{level}</abbr>
{/if}

<style>
  .level-badge {
    display: inline-block;
    margin-left: 0.4rem;
    padding: 0.05rem 0.45rem;
    border-radius: var(--radius-pill);
    background: var(--accent-soft);
    border: 1px solid var(--accent-soft-border);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    text-decoration: none;
    cursor: help;
    vertical-align: middle;
    white-space: nowrap;
  }
</style>
