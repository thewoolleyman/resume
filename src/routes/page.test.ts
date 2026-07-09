import { makeResumeData } from "$lib/__fixtures__/resume";
import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Page from "./+page.svelte";

describe("interactive route (/)", () => {
  let target: HTMLElement;

  beforeEach(() => {
    window.location.hash = "";
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    target.remove();
  });

  it("renders the interactive resume app from the loaded data", () => {
    const component = mount(Page, {
      target,
      props: { data: { resume: makeResumeData() } },
    });
    expect(target.querySelector(".sticky-nav")).not.toBeNull();
    expect(target.querySelector(".resume-name")?.textContent).toBe(
      "Chad Woolley",
    );
    void unmount(component);
  });
});
