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

  it("renders children and emits the per-route canonical from layout data", () => {
    const children = createRawSnippet(() => ({
      render: () => `<p data-testid="child">child content</p>`,
    }));
    // The canonical is the route's own production URL supplied by the layout
    // load (data.canonical), NOT a hard-coded root — so /static canonicalizes
    // to /static, not to / (F3 live-review finding; contracts.md §"Web routes").
    const component = mount(Layout, {
      target,
      props: {
        children,
        data: { canonical: "https://resume.thewoolleyweb.com/static" },
      },
    });
    flushSync();
    expect(target.querySelector('[data-testid="child"]')?.textContent).toBe(
      "child content",
    );
    // svelte:head metadata is injected into document.head.
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    ).toBe("https://resume.thewoolleyweb.com/static");
    expect(document.head.querySelector('meta[name="robots"]')).not.toBeNull();
    void unmount(component);
  });
});
