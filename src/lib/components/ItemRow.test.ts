import type { ResumeItem } from "$lib/data/types";

import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import ItemRow from "./ItemRow.svelte";

function makeItem(overrides: Partial<ResumeItem> = {}): ResumeItem {
  return {
    id: "job-history-role",
    title: "Senior Engineer",
    level: "teach",
    start: "2006-04-15",
    end: "2019-10-29",
    startDisplay: "4.2006 -",
    endDisplay: "10.2019",
    startSortKey: 0,
    endSortKey: 0,
    descriptionMarkdown: "Did **things**",
    descriptionHtml: "<p>Did <strong>things</strong></p>",
    searchText: "Senior Engineer Did things",
    ...overrides,
  };
}

describe("ItemRow", () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    target.remove();
  });

  it("renders the item name, dates, rendered description, and stable anchor id", () => {
    const component = mount(ItemRow, { target, props: { item: makeItem() } });
    const article = target.querySelector<HTMLElement>("article.item");
    expect(article?.id).toBe("job-history-role");
    expect(target.querySelector(".item-title")?.textContent).toBe(
      "Senior Engineer",
    );
    expect(target.querySelector(".date-start")?.textContent).toBe("4.2006 -");
    expect(target.querySelector(".date-end")?.textContent).toBe("10.2019");
    expect(target.querySelector(".item-desc")?.innerHTML).toContain(
      "<strong>things</strong>",
    );
    // Level badge rendered for a defined level.
    expect(target.querySelector(".level-badge")?.textContent).toBe("teach");
    // A hash-revealed item clears the sticky nav via scroll-margin.
    expect(article).not.toBeNull();
    void unmount(component);
  });

  it("renders no level badge for a level-less item", () => {
    const component = mount(ItemRow, {
      target,
      props: { item: makeItem({ level: null }) },
    });
    expect(target.querySelector(".level-badge")).toBeNull();
    void unmount(component);
  });
});
