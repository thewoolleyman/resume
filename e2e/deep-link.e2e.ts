import { expect, test } from "@playwright/test";

import { box, HOME, items, open, stickyNav, TOTAL_ITEMS } from "./helpers";

const PIVOTAL_ID = "job-history-senior-software-engineer-pivotal";

test("navigates to a stable resume item after data loads", async ({ page }) => {
  await open(page, `${HOME}#${PIVOTAL_ID}`);

  const item = page.locator(`#${PIVOTAL_ID}`);
  await expect(item).toBeVisible();
  await expect(item.locator(".item-title")).toHaveText(
    "Senior Software Engineer, Pivotal",
  );

  // The reveal scrolled the deep-linked item (it lives far below the fold), and
  // the item sits below the sticky nav rather than under it.
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const navBox = await box(stickyNav(page));
  const itemBox = await box(item);
  expect(itemBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height - 1);
});

test("a missing anchor hash is a no-op with no scroll or error", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await open(page, `${HOME}#no-such-anchor`);

  // Default ordered view intact: every item still rendered, nothing scrolled,
  // nothing hidden, no runtime error.
  await expect(items(page)).toHaveCount(TOTAL_ITEMS);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(errors).toEqual([]);
});

test("a revealed section heading clears the sticky navigation bar", async ({
  page,
}) => {
  await open(page, `${HOME}#formal-education`);

  const heading = page.locator("#heading-formal-education");
  await expect(heading).toBeVisible();

  // The section offset anchor's scroll-margin-top keeps the heading below the
  // sticky nav after the reveal.
  const navBox = await box(stickyNav(page));
  const headingBox = await box(heading);
  expect(headingBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height - 1);
});

test("a legacy list-ordinal hash reveals the matching section", async ({
  page,
}) => {
  // `#list-2` is the legacy one-based ordinal for the second governed section,
  // Formal Education, resolved through the stable slug.
  await open(page, `${HOME}#list-2`);

  const heading = page.locator("#heading-formal-education");
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText("Formal Education");

  // The section is below the fold, so resolving the legacy alias scrolled to
  // it and left it clear of the sticky nav.
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const navBox = await box(stickyNav(page));
  const headingBox = await box(heading);
  expect(headingBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height - 1);
});
