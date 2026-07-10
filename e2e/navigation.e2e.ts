import { expect, test } from "@playwright/test";

import {
  expectNoHorizontalScroll,
  HOME,
  open,
  searchBox,
  stickyNav,
} from "./helpers";

test("navigation shell collapses on a narrow viewport and expands inline when widened", async ({
  page,
}) => {
  await page.setViewportSize({ width: 400, height: 900 });
  await open(page, HOME);

  // Narrow: the controls collapse behind the Menu toggle, without horizontal
  // scroll.
  const menu = page.getByRole("button", { name: "Menu" });
  await expect(menu).toBeVisible();
  await expect(searchBox(page)).toBeHidden();
  await expectNoHorizontalScroll(page);

  // The toggle expands the collapsed controls in place.
  await menu.click();
  await expect(searchBox(page)).toBeVisible();

  // Wide: the toggle disappears and search / Contents / Skill Levels / Reset
  // sit inline with Instructions and About right-aligned.
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(menu).toBeHidden();
  await expect(searchBox(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
  await expect(
    stickyNav(page).getByText("Contents", { exact: true }),
  ).toBeVisible();
  await expect(
    stickyNav(page).getByText("Skill Levels", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Instructions" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "About" })).toBeVisible();
  const staticLink = page.getByRole("link", { name: "Static" });
  await expect(staticLink).toBeVisible();
  await expect(staticLink).toHaveAttribute("href", "/static");
  await expectNoHorizontalScroll(page);
});

test("the Static nav link navigates to the static resume", async ({ page }) => {
  await open(page, HOME);
  await page.getByRole("link", { name: "Static" }).click();
  await expect(page).toHaveURL(/\/static$/);
  await expect(page.locator(".static-resume")).toBeVisible();
});

test("nav dropdown menus dismiss on outside press and Escape", async ({
  page,
}) => {
  await open(page, HOME);
  const contents = page.locator("details.nav-menu", {
    has: page.getByText("Contents", { exact: true }),
  });

  // Opening then pressing outside the menu (the search box) dismisses it.
  await contents.locator("summary").click();
  await expect(contents).toHaveJSProperty("open", true);
  await searchBox(page).click();
  await expect(contents).toHaveJSProperty("open", false);

  // Opening then pressing Escape dismisses it.
  await contents.locator("summary").click();
  await expect(contents).toHaveJSProperty("open", true);
  await page.keyboard.press("Escape");
  await expect(contents).toHaveJSProperty("open", false);
});

test("About and Instructions controls open with governed content", async ({
  page,
}) => {
  await open(page, HOME);

  await page.getByRole("button", { name: "About" }).click();
  const about = page.getByTestId("about-panel");
  await expect(about).toBeVisible();
  // About shows the governed about.title as its panel heading and renders
  // markdown body (at least one rendered block element). The panel's own title
  // is its first h2; the rendered about.content markdown may itself contain
  // further headings, so scope to the first.
  await expect(about.locator("h2").first()).toHaveText("About This Resume/App");
  await expect(about.locator("p, ul, ol").first()).toBeVisible();

  await page.getByRole("button", { name: "Instructions" }).click();
  const instructions = page.getByTestId("instructions-panel");
  await expect(instructions).toBeVisible();
  await expect(instructions).toContainText("Live search");
  await expect(instructions).toContainText("Contents");
  await expect(instructions).toContainText("Skill Levels");
  await expect(instructions).toContainText("collapsed");
  await expect(instructions).toContainText("sorted");
  await expect(instructions).toContainText("Reset");

  // Both panels open without leaving interactive mode (the app shell stays).
  await expect(stickyNav(page)).toBeVisible();
});
