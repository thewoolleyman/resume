// Shared helpers for the browser-observable phase-1 Playwright specs mapped in
// scenario-coverage.json. Not a spec itself (does not end in .e2e.ts, so the
// Playwright testMatch skips it) — just DOM locators and open-and-hydrate
// utilities the specs import.
import { expect, type Locator, type Page } from "@playwright/test";

export const HOME = "/";
export const STATIC = "/static";

// The pinned production inventory (spec.md §"Governed data source"): 16
// sections, 74 items. Used as the default-view fingerprint.
export const TOTAL_ITEMS = 74;

// Opens a route and waits until the prerendered response has hydrated, so
// subsequent event-handler interactions (search, toggles, sort) are live.
// networkidle fires after the SvelteKit client bundle has loaded and run its
// synchronous hydration, so handlers are attached by the time it resolves.
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

// Every rendered resume item row (interactive and static share ItemRow).
export function items(page: Page): Locator {
  return page.locator('[data-testid="item"]');
}

// The visible item titles, in DOM order.
export async function itemTitles(scope: Page | Locator): Promise<string[]> {
  return scope.locator('[data-testid="item"] .item-title').allInnerTexts();
}

// The interactive section whose heading carries the given stable slug.
export function section(page: Page, slug: string): Locator {
  return page.locator("section.section", {
    has: page.locator(`#heading-${slug}`),
  });
}

// The interactive live-search box (input[type=search], aria-label "Search
// resume" → the searchbox role).
export function searchBox(page: Page): Locator {
  return page.getByRole("searchbox", { name: "Search resume" });
}

// The sticky navigation bar.
export function stickyNav(page: Page): Locator {
  return page.locator("nav.sticky-nav");
}

// Reads a <head> meta tag's content attribute.
export async function metaContent(
  page: Page,
  name: string,
): Promise<string | null> {
  return page.locator(`meta[name="${name}"]`).getAttribute("content");
}

// Returns an element's bounding box, throwing if it is not laid out — keeps
// callers free of non-null assertions when comparing geometry.
export async function box(
  locator: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const rect = await locator.boundingBox();
  if (rect === null) {
    throw new Error("expected the element to have a bounding box");
  }
  return rect;
}

// Asserts the document does not scroll horizontally on the current viewport:
// the layout pins html to overflow-x: hidden, so a right-scroll attempt leaves
// the horizontal scroll offset at 0 (content that would overflow is clipped,
// not scrollable).
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const scrolledX = await page.evaluate(() => {
    window.scrollTo(document.documentElement.scrollWidth, 0);
    const x = window.scrollX;
    window.scrollTo(0, window.scrollY);
    return x;
  });
  expect(scrolledX).toBe(0);
}
