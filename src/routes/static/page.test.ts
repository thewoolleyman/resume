import { makeResumeData } from "$lib/__fixtures__/resume";
import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Page from "./+page.svelte";

describe("static route (/static)", () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    target.remove();
  });

  it("renders the fully-expanded static resume from the loaded data", () => {
    const component = mount(Page, {
      target,
      props: { data: { resume: makeResumeData() } },
    });
    expect(target.querySelector(".static-resume")).not.toBeNull();
    expect(target.querySelector("h1")?.textContent).toBe("Chad Woolley");
    expect(target.querySelectorAll("article.item")).toHaveLength(3);
    void unmount(component);
  });
});
