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
    max-width: 52rem;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
  }
  .static-header h1 {
    margin: 0;
    font-size: clamp(1.7rem, 5vw, 2.3rem);
    font-weight: 650;
    letter-spacing: -0.02em;
    color: var(--text);
  }
  .contact {
    margin: 0.4rem 0 0;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }
  .static-about {
    margin-top: 1.75rem;
  }
  .static-section {
    margin-top: 2rem;
  }
  .static-about h2,
  .static-section h2 {
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text);
    border-bottom: 1px solid var(--border-strong);
    padding-bottom: 0.35rem;
  }
  .static-about :global(a) {
    text-decoration: underline;
  }
  .static-about :global(code) {
    font-family: var(--font-mono);
    font-size: 0.85em;
    background: var(--bg-subtle);
    padding: 0.1em 0.35em;
    border-radius: var(--radius-sm);
  }
  @media print {
    .static-resume {
      max-width: none;
      padding: 0;
    }
  }
</style>
