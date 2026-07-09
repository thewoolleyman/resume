<script lang="ts">
  import type { ResumeData } from "$lib/data/types";

  import ItemRow from "./ItemRow.svelte";

  interface Props {
    data: ResumeData;
  }

  let { data }: Props = $props();
</script>

<article class="static-resume">
  <header class="static-header">
    <h1>{data.profile.header.name}</h1>
    <p class="contact">{data.profile.header.contact}</p>
  </header>

  <section class="static-about" aria-labelledby="static-about-title">
    <h2 id="static-about-title">{data.profile.about.title}</h2>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <div>{@html data.profile.about.contentHtml}</div>
  </section>

  {#each data.sections as section (section.id)}
    <section class="static-section" aria-labelledby={`static-${section.id}`}>
      <span id={section.id} class="offset-anchor"></span>
      <h2 id={`static-${section.id}`}>{section.name}</h2>
      {#each section.items as item (item.id)}
        <ItemRow {item} />
      {/each}
    </section>
  {/each}
</article>

<style>
  .static-resume {
    max-width: 55rem;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }
  .static-header h1 {
    margin: 0;
  }
  .contact {
    color: #444;
  }
  .static-section {
    margin-top: 1.5rem;
  }
  .static-section h2 {
    border-bottom: 2px solid #1a1a2e;
    padding-bottom: 0.25rem;
  }
  @media print {
    .static-resume {
      max-width: none;
    }
  }
</style>
