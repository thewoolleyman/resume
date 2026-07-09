import type { ResumeItem, ResumeSection } from "$lib/data/types";

import { reactiveProps } from "$lib/__fixtures__/reactive-props.svelte";
import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SectionView from "./SectionView.svelte";

function makeItem(id: string, title: string): ResumeItem {
  return {
    id,
    title,
    level: null,
    start: null,
    end: null,
    startDisplay: "",
    endDisplay: "current",
    startSortKey: 0,
    endSortKey: 0,
    descriptionMarkdown: "",
    descriptionHtml: "<p></p>",
    searchText: title,
  };
}

const section: ResumeSection = {
  id: "job-history",
  ordinal: 1,
  name: "Job History",
  items: [makeItem("job-history-a", "A"), makeItem("job-history-b", "B")],
};

describe("SectionView", () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    target.remove();
  });

  it("renders the section heading, offset anchor, sort options, and items when expanded", () => {
    const component = mount(SectionView, {
      target,
      props: {
        section,
        items: section.items,
        collapsed: false,
        sort: "default",
        onToggle: () => {},
        onSort: () => {},
      },
    });
    expect(target.querySelector("#job-history")).not.toBeNull();
    expect(target.querySelector(".section-name")?.textContent).toBe(
      "Job History",
    );
    // Seven sort options.
    expect(target.querySelectorAll("select option")).toHaveLength(7);
    expect(target.querySelectorAll("article.item")).toHaveLength(2);
    expect(target.querySelector(".collapse-toggle")?.textContent).toContain(
      "▾",
    );
    void unmount(component);
  });

  it("hides rows but keeps the header when collapsed", () => {
    const component = mount(SectionView, {
      target,
      props: {
        section,
        items: section.items,
        collapsed: true,
        sort: "default",
        onToggle: () => {},
        onSort: () => {},
      },
    });
    expect(target.querySelector(".section-name")).not.toBeNull();
    expect(target.querySelector(".section-body")).toBeNull();
    expect(target.querySelector(".collapse-toggle")?.textContent).toContain(
      "▸",
    );
    void unmount(component);
  });

  it("shows an explicit no-results state when no items match", () => {
    const component = mount(SectionView, {
      target,
      props: {
        section,
        items: [],
        collapsed: false,
        sort: "default",
        onToggle: () => {},
        onSort: () => {},
      },
    });
    expect(target.querySelector('[data-testid="no-results"]')).not.toBeNull();
    expect(target.querySelectorAll("article.item")).toHaveLength(0);
    void unmount(component);
  });

  it("drives the sort-option each: reconcile branches and null-ish value coalescing", () => {
    // Decision 1 (SPECIFICATION/non-functional-requirements.md §"Test coverage
    // expectations"): the sort-option list is a static production constant, so
    // its keyed-{#each} update path and Svelte's compiler-generated `?? ''`
    // value/id coalescing never run in production. Inject the list — plus a
    // null-ish `sort` and option `id` the types forbid in production but the
    // framework guards — to reach the 100% branch floor without weakening the
    // gate.
    const props = reactiveProps({
      section,
      items: section.items,
      collapsed: false,
      sort: null as unknown as string,
      onToggle: () => {},
      onSort: () => {},
      sortOptions: [
        { id: "default", label: "Default" },
        { id: "name-asc", label: "Name Asc" },
        { id: null as unknown as string, label: "Nullish" },
      ],
    });
    const component = mount(SectionView, { target, props });
    const options = [
      ...target.querySelectorAll<HTMLOptionElement>("select option"),
    ];
    expect(options).toHaveLength(3);
    // The null-ish option id and null-ish sort both coalesce to "".
    expect(options[2]?.value).toBe("");

    // Reconcile: default's label changes (update), name-asc is unchanged, the
    // null-ish option is removed, and start-asc is added.
    props.sortOptions = [
      { id: "default", label: "Renamed Default" },
      { id: "name-asc", label: "Name Asc" },
      { id: "start-asc", label: "Start Date Asc" },
    ];
    flushSync();
    const labels = [...target.querySelectorAll("select option")].map(
      (option) => option.textContent,
    );
    expect(labels).toEqual(["Renamed Default", "Name Asc", "Start Date Asc"]);
    void unmount(component);
  });

  it("invokes onToggle and onSort from the header controls", () => {
    const onToggle = vi.fn();
    const onSort = vi.fn();
    const component = mount(SectionView, {
      target,
      props: {
        section,
        items: section.items,
        collapsed: false,
        sort: "default",
        onToggle,
        onSort,
      },
    });
    target.querySelector<HTMLButtonElement>(".collapse-toggle")?.click();
    flushSync();
    expect(onToggle).toHaveBeenCalledOnce();

    const select = target.querySelector<HTMLSelectElement>("select");
    if (select) {
      select.value = "name-asc";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      flushSync();
    }
    expect(onSort).toHaveBeenCalledWith("name-asc");
    void unmount(component);
  });
});
