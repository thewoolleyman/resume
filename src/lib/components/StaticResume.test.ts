import { makeResumeData } from "$lib/__fixtures__/resume";
import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import StaticResume from "./StaticResume.svelte";

describe("StaticResume", () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    target.remove();
  });

  it("renders all governed data fully expanded in canonical order without controls", () => {
    const component = mount(StaticResume, {
      target,
      props: { data: makeResumeData() },
    });
    // Header + about.
    expect(target.querySelector("h1")?.textContent).toBe("Chad Woolley");
    expect(target.textContent).toContain("About This Resume");
    // Every section, in governed order, with offset anchors and all items.
    const headings = [...target.querySelectorAll(".static-section h2")].map(
      (heading) => heading.textContent,
    );
    expect(headings).toEqual(["Job History", "Skills"]);
    expect(target.querySelector("#job-history")).not.toBeNull();
    expect(target.querySelectorAll("article.item")).toHaveLength(3);
    // No interactive controls (search / sort / collapse).
    expect(target.querySelector("select")).toBeNull();
    expect(target.querySelector(".collapse-toggle")).toBeNull();
    void unmount(component);
  });
});
