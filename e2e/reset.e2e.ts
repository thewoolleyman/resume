import { expect, test } from "@playwright/test";

import { HOME, items, open, searchBox, section, TOTAL_ITEMS } from "./helpers";

const PIVOTAL_ID = "job-history-senior-software-engineer-pivotal";

test("Reset clears search, restores skill levels and sorts, expands sections, scrolls to top, and clears the hash", async ({
  page,
}) => {
  // Start from a deep-linked hash so Reset has hash state to clear.
  await open(page, `${HOME}#${PIVOTAL_ID}`);
  const jobs = section(page, "job-history");
  const education = section(page, "formal-education");

  // Enter a search term, deselect a skill level, change a section sort, and
  // collapse a section.
  await searchBox(page).fill("developer");

  const skillLevels = page.locator("details.nav-menu", {
    has: page.getByText("Skill Levels", { exact: true }),
  });
  await skillLevels.locator("summary").click();
  await skillLevels
    .locator("label", { hasText: "teach" })
    .getByRole("checkbox")
    .click();

  await jobs.getByRole("combobox").selectOption({ label: "Name Asc" });
  await education.locator(".collapse-toggle").click();

  // Sanity: the interactions took effect before Reset.
  await expect(items(page)).not.toHaveCount(TOTAL_ITEMS);

  await page.getByRole("button", { name: "Reset" }).click();

  // Search text cleared, all levels selected, every sort back to default,
  // collapsed sections expanded → the full default-ordered view returns.
  await expect(searchBox(page)).toHaveValue("");
  await expect(items(page)).toHaveCount(TOTAL_ITEMS);
  await expect(jobs.getByRole("combobox")).toHaveValue("default");
  await expect(education.locator('[data-testid="item"]')).toHaveCount(2);

  // The view scrolled to the top and the deep-link hash cleared.
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.evaluate(() => window.location.hash)).toBe("");
});
