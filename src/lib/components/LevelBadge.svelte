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
    padding: 0 0.4rem;
    border-radius: 0.6rem;
    background: #2b2b40;
    color: #cfd2ff;
    font-size: 0.72rem;
    text-decoration: none;
    cursor: help;
    vertical-align: middle;
  }
</style>
