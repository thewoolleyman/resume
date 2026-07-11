<script lang="ts">
  import type { Snippet } from "svelte";

  import "../app.css";
  import type { LayoutData } from "./$types";

  interface Props {
    children: Snippet;
    data: LayoutData;
  }

  let { children, data }: Props = $props();
</script>

<svelte:head>
  <title>Chad Woolley - Resume</title>
  <meta
    name="description"
    content="The interactive and static resume of Chad Woolley — senior fullstack engineer."
  />
  <!-- Each route self-canonicalizes to its own production URL (data.canonical,
       computed in +layout.ts). The absolute production origin keeps Preview and
       Development deployments non-canonical, so a preview is never presented as
       the canonical resume URL (SPECIFICATION/constraints.md §"Framework and
       deployment"). -->
  <link rel="canonical" href={data.canonical} />
  <meta name="robots" content="index, follow" />
</svelte:head>

{@render children()}
