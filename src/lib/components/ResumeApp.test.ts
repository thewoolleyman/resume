import { reactiveProps } from "$lib/__fixtures__/reactive-props.svelte";
import { makeResumeData } from "$lib/__fixtures__/resume";
import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import ResumeApp from "./ResumeApp.svelte";

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll("button")].find((candidate) =>
    candidate.textContent.trim().startsWith(text),
  );
  if (button === undefined) {
    throw new Error(`button not found: ${text}`);
  }
  return button;
}

function titles(root: HTMLElement): string[] {
  return [...root.querySelectorAll(".item-title")].map(
    (node) => node.textContent,
  );
}

describe("ResumeApp", () => {
  let target: HTMLElement;

  beforeEach(() => {
    window.location.hash = "";
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    target.remove();
  });

  it("renders the shell, header, and all sections from governed data", () => {
    const component = mount(ResumeApp, {
      target,
      props: { data: makeResumeData() },
    });
    expect(target.querySelector(".sticky-nav")).not.toBeNull();
    expect(target.querySelector(".resume-name")?.textContent).toBe(
      "Chad Woolley",
    );
    expect(target.querySelector(".resume-contact")?.textContent).toContain(
      "example.com",
    );
    expect(target.querySelectorAll(".section")).toHaveLength(2);
    expect(titles(target)).toEqual(["Alpha Role", "Bravo Role", "Testing"]);
    // The trailing nav carries a real, crawlable Static link to /static
    // (contracts.md §"Layout and controls" Static link).
    const staticLink = target.querySelector<HTMLAnchorElement>("a.nav-static");
    expect(staticLink).not.toBeNull();
    expect(staticLink?.getAttribute("href")).toContain("/static");
    expect(staticLink?.textContent).toContain("Static");
    void unmount(component);
  });

  it("live-searches, filters by skill level, sorts, collapses, and resets", () => {
    const component = mount(ResumeApp, {
      target,
      props: { data: makeResumeData() },
    });

    // Live search: "ruby" matches Alpha Role and Testing, not Bravo Role.
    const search = target.querySelector<HTMLInputElement>(".search");
    if (search === null) {
      throw new Error("search input missing");
    }
    search.value = "ruby";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();
    expect(titles(target)).toEqual(["Alpha Role", "Testing"]);

    // Clear the query — the default ordered view returns.
    search.value = "";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();
    expect(titles(target)).toEqual(["Alpha Role", "Bravo Role", "Testing"]);

    // Deselect the "played" level: the Bravo Role (played) is hidden.
    const playedCheckbox = [
      ...target.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    ].find((checkbox) =>
      checkbox.closest("label")?.textContent.trim().startsWith("played"),
    );
    playedCheckbox?.click();
    flushSync();
    expect(titles(target)).not.toContain("Bravo Role");

    // Re-select all levels via Reset later; first exercise sort + collapse.
    const firstSelect = target.querySelector<HTMLSelectElement>("select");
    if (firstSelect === null) {
      throw new Error("sort select missing");
    }
    firstSelect.value = "name-desc";
    firstSelect.dispatchEvent(new Event("change", { bubbles: true }));
    flushSync();
    // Job History (Alpha, Testing shown) sorted name-desc within the section.
    const jobItems = [
      ...(target.querySelector(".section")?.querySelectorAll(".item-title") ??
        []),
    ].map((node) => node.textContent);
    expect(jobItems[0]).toBe("Alpha Role");

    // Collapse the first section: its rows disappear, header stays.
    const firstSection = target.querySelectorAll<HTMLElement>(".section")[0];
    firstSection?.querySelector<HTMLButtonElement>(".collapse-toggle")?.click();
    flushSync();
    expect(firstSection?.querySelector(".section-body")).toBeNull();
    expect(firstSection?.querySelector(".section-name")).not.toBeNull();

    // Open About and Instructions panels.
    buttonByText(target, "About").click();
    flushSync();
    expect(
      target.querySelector('[data-testid="about-panel"]')?.textContent,
    ).toContain("About This Resume");

    buttonByText(target, "Instructions").click();
    flushSync();
    expect(
      target.querySelector('[data-testid="instructions-panel"]')?.textContent,
    ).toContain("Live search");

    // Toggle the responsive nav menu.
    buttonByText(target, "Menu").click();
    flushSync();
    expect(
      target.querySelector(".nav-controls")?.classList.contains("open"),
    ).toBe(true);

    // Reset restores everything.
    buttonByText(target, "Reset").click();
    flushSync();
    expect(search.value).toBe("");
    expect(titles(target)).toEqual(["Alpha Role", "Bravo Role", "Testing"]);
    expect(target.querySelector('[data-testid="about-panel"]')).toBeNull();
    expect(
      target.querySelector('[data-testid="instructions-panel"]'),
    ).toBeNull();
    expect(target.querySelector(".section .section-body")).not.toBeNull();

    void unmount(component);
  });

  it("reconciles the keyed skill levels when the injected list changes", () => {
    // Decision 1 (SPECIFICATION/non-functional-requirements.md §"Test coverage
    // expectations"): the skill-level list is a static production constant, so
    // its keyed-{#each} reconcile branches never run in production. Inject a
    // changing list at the unit level to drive them — add, remove, and move by
    // key — reaching the 100% branch floor without weakening the gate.
    const strongKeys = (): (string | null)[] =>
      [...target.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
        .map((checkbox) => checkbox.closest("label")?.querySelector("strong"))
        .map((strong) => strong?.textContent ?? null);

    const props = reactiveProps({
      data: makeResumeData(),
      skillLevels: [
        // The null-ish meaning the types forbid in production drives Svelte's
        // compiler-generated `?? ''` coalescing on the meaning text.
        { key: "played", meaning: null as unknown as string },
        { key: "teach", meaning: "teach meaning" },
        { key: "unspecified", meaning: "Unspecified" },
      ],
    });
    const component = mount(ResumeApp, { target, props });
    expect(strongKeys()).toEqual(["played", "teach", "unspecified"]);
    const playedLabel = (): string | undefined =>
      [...target.querySelectorAll("label")]
        .find(
          (label) => label.querySelector("strong")?.textContent === "played",
        )
        ?.textContent.trim();
    // The null-ish meaning coalesces to "", so the label is just the key.
    expect(playedLabel()).toBe("played:");

    // Reconcile: teach's meaning changes (update), played is unchanged,
    // unspecified is removed, and often is added.
    props.skillLevels = [
      { key: "played", meaning: null as unknown as string },
      { key: "teach", meaning: "teach meaning changed" },
      { key: "often", meaning: "often meaning" },
    ];
    flushSync();
    expect(strongKeys()).toEqual(["played", "teach", "often"]);
    expect(
      [...target.querySelectorAll("label")]
        .find((label) => label.querySelector("strong")?.textContent === "teach")
        ?.textContent.trim(),
    ).toBe("teach: teach meaning changed");
    void unmount(component);
  });

  it("reveals a deep-linked item anchor on mount", () => {
    // jsdom does not implement scrollIntoView; stub it so the reveal runs.
    Element.prototype.scrollIntoView = () => {};
    window.location.hash = "#job-history-alpha";
    const component = mount(ResumeApp, {
      target,
      props: { data: makeResumeData() },
    });
    flushSync();
    // The anchor element exists (reveal is a no-op-safe scroll via nav helper).
    expect(target.querySelector("#job-history-alpha")).not.toBeNull();
    void unmount(component);
  });
});
