import { createRawSnippet, flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { prerender } from "./+layout";
import Layout from "./+layout.svelte";

describe("root layout", () => {
  let target: HTMLElement;

  beforeEach(() => {
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    target.remove();
  });

  it("prerenders every route (build-time governed-data load)", () => {
    expect(prerender).toBe(true);
  });

  it("renders its children and sets the page title", () => {
    const children = createRawSnippet(() => ({
      render: () => `<p data-testid="child">child content</p>`,
    }));
    const component = mount(Layout, { target, props: { children } });
    flushSync();
    expect(target.querySelector('[data-testid="child"]')?.textContent).toBe(
      "child content",
    );
    // svelte:head metadata is injected into document.head.
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    ).toBe("https://resume.thewoolleyweb.com/");
    expect(document.head.querySelector('meta[name="robots"]')).not.toBeNull();
    void unmount(component);
  });
});
