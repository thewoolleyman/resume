<script lang="ts">
  import type { Snippet } from "svelte";

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

<style>
  :global(html) {
    overflow-x: hidden;
  }
  :global(body) {
    margin: 0;
    font-family:
      system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      Helvetica,
      Arial,
      sans-serif;
    color: #1a1a2e;
    background: #ffffff;
    line-height: 1.5;
  }
  :global(*) {
    box-sizing: border-box;
  }
  :global(a) {
    color: #2b3fb8;
  }
</style>
