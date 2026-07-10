<script lang="ts">
  import type { Snippet } from "svelte";

  import "../app.css";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<svelte:head>
  <title>Chad Woolley - Resume</title>
  <meta
    name="description"
    content="The interactive and static resume of Chad Woolley — senior fullstack engineer."
  />
  <!-- Preview deployments are de-indexed by canonicalizing to production, so a
       preview is never presented as the canonical resume URL
       (SPECIFICATION/constraints.md §"Framework and deployment"). -->
  <link rel="canonical" href="https://resume.thewoolleyweb.com/" />
  <meta name="robots" content="index, follow" />
</svelte:head>

{@render children()}
