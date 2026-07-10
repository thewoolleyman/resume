<script lang="ts">
  import type { ResumeData } from "$lib/data/types";
  import type { SkillLevel } from "$lib/skill-levels";

  import { resolve } from "$app/paths";
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

  // A native <details> dropdown stays open until its summary is clicked again;
  // these dismiss the Contents/Skill Levels menus when the visitor interacts
  // elsewhere. `target === null` is the Escape/keyboard case (close every open
  // menu); otherwise close only the menus the pointer landed outside of.
  function closeMenusOutside(target: EventTarget | null): void {
    const menus = document.querySelectorAll<HTMLDetailsElement>(
      "details.nav-menu[open]",
    );
    for (const menu of menus) {
      if (target === null || !menu.contains(target as Node)) {
        menu.open = false;
      }
    }
  }

  function onDocumentPointerDown(event: PointerEvent): void {
    closeMenusOutside(event.target);
  }

  function onDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      closeMenusOutside(null);
    }
  }

  // Close a menu when focus leaves it (keyboard tab-away or a click that moves
  // focus outside), keeping it open while focus stays on its own controls.
  function onMenuFocusOut(event: FocusEvent): void {
    const menu = event.currentTarget as HTMLDetailsElement;
    const next = event.relatedTarget as Node | null;
    if (next === null || !menu.contains(next)) {
      menu.open = false;
    }
  }

  onMount(() => {
    revealAnchor(window.location.hash, data.sections, document);
    document.addEventListener("pointerdown", onDocumentPointerDown);
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onDocumentPointerDown);
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
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
      <details class="nav-menu" onfocusout={onMenuFocusOut}>
        <summary>Contents</summary>
        <ul>
          {#each data.sections as section (section.id)}
            <li><a href={`#${section.id}`}>{section.name}</a></li>
          {/each}
        </ul>
      </details>
      <details class="nav-menu" onfocusout={onMenuFocusOut}>
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
        <a class="nav-btn nav-static" href={resolve("/static")}>Static</a>
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
    z-index: 20;
    background: var(--nav-bg);
    color: var(--nav-text);
    border-bottom: 1px solid var(--nav-border);
  }
  .nav-inner {
    max-width: var(--maxw);
    margin: 0 auto;
    padding: 0.55rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }
  .nav-toggle {
    display: none;
  }
  .nav-controls {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
    width: 100%;
  }
  .nav-trailing {
    margin-left: auto;
    display: flex;
    gap: 0.4rem;
  }
  .search {
    padding: 0.42rem 0.7rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--nav-border);
    background: var(--nav-surface);
    color: var(--nav-text);
    font: inherit;
    font-size: 0.9rem;
    min-width: 13rem;
  }
  .search::placeholder {
    color: var(--nav-muted);
  }
  .nav-btn {
    background: var(--nav-surface);
    color: var(--nav-text);
    border: 1px solid transparent;
    padding: 0.4rem 0.72rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
    line-height: 1.2;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition:
      background 0.12s ease,
      border-color 0.12s ease;
  }
  .nav-btn:hover {
    background: var(--nav-surface-hover);
    color: var(--nav-text);
  }
  /* The Static link is the prominent cross-route affordance: accent-outlined so
     it reads as the primary trailing action rather than another toggle. */
  .nav-static {
    background: transparent;
    border-color: var(--nav-border);
    color: var(--nav-accent);
    font-weight: 600;
  }
  .nav-static:hover {
    background: var(--nav-surface);
    color: var(--nav-accent);
    border-color: var(--nav-accent);
  }
  .nav-menu {
    position: relative;
  }
  .nav-menu > summary {
    cursor: pointer;
    list-style: none;
    padding: 0.4rem 0.72rem;
    border-radius: var(--radius-sm);
    background: var(--nav-surface);
    color: var(--nav-text);
    font-size: 0.85rem;
    user-select: none;
  }
  .nav-menu > summary::-webkit-details-marker {
    display: none;
  }
  .nav-menu > summary:hover,
  .nav-menu[open] > summary {
    background: var(--nav-surface-hover);
  }
  .nav-menu ul {
    position: absolute;
    z-index: 30;
    background: var(--nav-surface);
    border: 1px solid var(--nav-border);
    padding: 0.4rem;
    margin: 0.4rem 0 0;
    max-height: 60vh;
    overflow: auto;
    border-radius: var(--radius);
    min-width: 17rem;
    box-shadow: var(--shadow);
    list-style: none;
  }
  .nav-menu li {
    list-style: none;
  }
  .nav-menu a {
    color: var(--nav-accent);
    text-decoration: none;
    display: block;
    padding: 0.28rem 0.4rem;
    border-radius: var(--radius-sm);
  }
  .nav-menu a:hover {
    background: var(--nav-surface-hover);
  }
  .nav-menu label {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    padding: 0.28rem 0.4rem;
    font-size: 0.85rem;
    color: var(--nav-text);
    cursor: pointer;
  }
  .nav-menu label strong {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--nav-accent);
  }
  .resume-header {
    text-align: center;
    background: var(--nav-bg);
    color: var(--nav-text);
    padding: 2.5rem 1.25rem;
    border-bottom: 1px solid var(--nav-border);
  }
  .resume-name {
    margin: 0;
    font-size: clamp(1.6rem, 4vw, 2.15rem);
    font-weight: 650;
    letter-spacing: -0.02em;
  }
  .resume-contact {
    margin: 0.55rem 0 0;
    color: var(--nav-muted);
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }
  .resume-main {
    max-width: var(--maxw);
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
  }
  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.75rem;
    box-shadow: var(--shadow-sm);
  }
  .panel h2 {
    margin-top: 0;
    font-size: 1.15rem;
    letter-spacing: -0.01em;
  }
  .panel :global(a) {
    text-decoration: underline;
  }
  @media (max-width: 720px) {
    .nav-toggle {
      display: inline-flex;
      align-items: center;
      background: var(--nav-surface);
      color: var(--nav-text);
      border: none;
      padding: 0.4rem 0.72rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font: inherit;
      font-size: 0.85rem;
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
      flex-wrap: wrap;
    }
  }
</style>
