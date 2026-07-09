<script lang="ts">
  import type { ResumeData } from "$lib/data/types";
  import type { SkillLevel } from "$lib/skill-levels";

  import { revealAnchor } from "$lib/nav";
  import { ALL_LEVEL_KEYS, SKILL_LEVELS } from "$lib/skill-levels";
  import { DEFAULT_SORT } from "$lib/sort/section-sort";
  import { composeOrOriginal, toggleInSet } from "$lib/view";
  import { onMount } from "svelte";

  import SectionView from "./SectionView.svelte";

  interface Props {
    data: ResumeData;
    // Injection seam (defaults to the production skill levels): a unit test can
    // supply a changing list to exercise the keyed-{#each} reconcile branches.
    skillLevels?: readonly SkillLevel[];
  }

  let { data, skillLevels = SKILL_LEVELS }: Props = $props();

  let query = $state("");
  let selectedLevels = $state<Set<string>>(new Set(ALL_LEVEL_KEYS));
  let sorts = $state<Record<string, string>>({});
  let collapsed = $state<Record<string, boolean>>({});
  let aboutOpen = $state(false);
  let instructionsOpen = $state(false);
  let navOpen = $state(false);

  function toggleLevel(key: string): void {
    selectedLevels = toggleInSet(selectedLevels, key);
  }

  function setSort(id: string, value: string): void {
    sorts = { ...sorts, [id]: value };
  }

  function toggleCollapse(id: string): void {
    collapsed = { ...collapsed, [id]: !(collapsed[id] ?? false) };
  }

  function reset(): void {
    query = "";
    selectedLevels = new Set(ALL_LEVEL_KEYS);
    sorts = {};
    collapsed = {};
    aboutOpen = false;
    instructionsOpen = false;
    navOpen = false;
    history.replaceState(null, "", window.location.pathname);
    window.scrollTo(0, 0);
  }

  onMount(() => {
    revealAnchor(window.location.hash, data.sections, document);
  });
</script>

<nav class="sticky-nav">
  <div class="nav-inner">
    <button
      type="button"
      class="nav-toggle"
      aria-expanded={navOpen}
      aria-controls="nav-controls"
      onclick={() => {
        navOpen = !navOpen;
      }}
    >
      Menu
    </button>
    <div id="nav-controls" class="nav-controls" class:open={navOpen}>
      <input
        type="search"
        class="search"
        placeholder="Search…"
        aria-label="Search resume"
        bind:value={query}
      />
      <details class="nav-menu">
        <summary>Contents</summary>
        <ul>
          {#each data.sections as section (section.id)}
            <li><a href={`#${section.id}`}>{section.name}</a></li>
          {/each}
        </ul>
      </details>
      <details class="nav-menu">
        <summary>Skill Levels</summary>
        <ul>
          {#each skillLevels as level (level.key)}
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={selectedLevels.has(level.key)}
                  onchange={() => {
                    toggleLevel(level.key);
                  }}
                />
                <strong>{level.key}</strong>: {level.meaning}
              </label>
            </li>
          {/each}
        </ul>
      </details>
      <button type="button" class="nav-btn" onclick={reset}>Reset</button>
      <div class="nav-trailing">
        <button
          type="button"
          class="nav-btn"
          aria-expanded={instructionsOpen}
          onclick={() => {
            instructionsOpen = !instructionsOpen;
          }}
        >
          Instructions
        </button>
        <button
          type="button"
          class="nav-btn"
          aria-expanded={aboutOpen}
          onclick={() => {
            aboutOpen = !aboutOpen;
          }}
        >
          About
        </button>
      </div>
    </div>
  </div>
</nav>

<header class="resume-header">
  <p class="resume-name">{data.profile.header.name}</p>
  <p class="resume-contact">{data.profile.header.contact}</p>
</header>

<main class="resume-main">
  {#if aboutOpen}
    <section class="panel about-panel" data-testid="about-panel">
      <h2>{data.profile.about.title}</h2>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <div>{@html data.profile.about.contentHtml}</div>
    </section>
  {/if}
  {#if instructionsOpen}
    <section class="panel instructions-panel" data-testid="instructions-panel">
      <h2>How to use this resume</h2>
      <ul>
        <li>Live search filters all resume text as you type.</li>
        <li>Contents scrolls to or reveals a selected section.</li>
        <li>
          Skill Levels checkboxes filter items by skill level; each level lists
          what it means (played, once, often, toolbox, teach, unspecified).
        </li>
        <li>
          Each section can be collapsed and expanded with its arrow control.
        </li>
        <li>
          Each section defaults to its original order and can be sorted
          independently by name, start date, or end date.
        </li>
        <li>
          Reset restores search, skill filters, per-section sort, and collapse
          state to their defaults.
        </li>
      </ul>
    </section>
  {/if}

  {#each data.sections as section (section.id)}
    <SectionView
      {section}
      items={composeOrOriginal(section.items, {
        query,
        selectedLevels,
        sort: sorts[section.id] ?? DEFAULT_SORT,
      })}
      collapsed={collapsed[section.id] ?? false}
      sort={sorts[section.id] ?? DEFAULT_SORT}
      onToggle={() => {
        toggleCollapse(section.id);
      }}
      onSort={(value: string) => {
        setSort(section.id, value);
      }}
    />
  {/each}
</main>

<style>
  .sticky-nav {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #1a1a2e;
    color: #f5f5fa;
  }
  .nav-inner {
    max-width: 60rem;
    margin: 0 auto;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .nav-toggle {
    display: none;
  }
  .nav-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    width: 100%;
  }
  .nav-trailing {
    margin-left: auto;
    display: flex;
    gap: 0.5rem;
  }
  .search {
    padding: 0.3rem 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid #444;
  }
  .nav-btn {
    background: #2b2b40;
    color: #f5f5fa;
    border: none;
    padding: 0.3rem 0.6rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  .nav-menu {
    position: relative;
  }
  .nav-menu > summary {
    cursor: pointer;
    list-style: none;
  }
  .nav-menu ul {
    position: absolute;
    background: #23233a;
    padding: 0.5rem 1rem;
    margin: 0.25rem 0 0;
    max-height: 60vh;
    overflow: auto;
    border-radius: 0.25rem;
    min-width: 16rem;
  }
  .nav-menu a {
    color: #cfd2ff;
  }
  .resume-header {
    text-align: center;
    background: #1a1a2e;
    color: #f5f5fa;
    padding: 1.5rem 1rem;
  }
  .resume-name {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 700;
  }
  .resume-contact {
    margin: 0.25rem 0 0;
    color: #cfd2ff;
  }
  .resume-main {
    max-width: 60rem;
    margin: 0 auto;
    padding: 1rem;
  }
  .panel {
    background: #f3f3fb;
    border: 1px solid #d7d7ee;
    border-radius: 0.4rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 720px) {
    .nav-toggle {
      display: inline-block;
      background: #2b2b40;
      color: #f5f5fa;
      border: none;
      padding: 0.3rem 0.6rem;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    .nav-controls {
      display: none;
      flex-direction: column;
      align-items: flex-start;
    }
    .nav-controls.open {
      display: flex;
    }
    .nav-trailing {
      margin-left: 0;
    }
  }
</style>
