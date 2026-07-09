import { expect, type Locator, test } from "@playwright/test";

import { HOME, itemTitles, open, section } from "./helpers";

const OPEN_SOURCE = "open-source-projects-created-contributed";

function firstTitle(sec: Locator): Locator {
  return sec.locator('[data-testid="item"] .item-title').first();
}
function lastTitle(sec: Locator): Locator {
  return sec.locator('[data-testid="item"] .item-title').last();
}

test("the seven sort options reorder a section's items", async ({ page }) => {
  await open(page, HOME);
  const jobs = section(page, "job-history");
  const select = jobs.getByRole("combobox");

  // All seven predecessor sort options are offered.
  await expect(select.locator("option")).toHaveText([
    "Default",
    "Name Asc",
    "Name Desc",
    "Start Date Asc",
    "Start Date Desc",
    "End Date Asc",
    "End Date Desc",
  ]);

  // Default keeps canonical governed order.
  await expect(firstTitle(jobs)).toContainText(
    "Senior Fullstack Engineer, GitLab",
  );

  await select.selectOption({ label: "Name Asc" });
  await expect(firstTitle(jobs)).toContainText("Application Integrator, IBM");

  await select.selectOption({ label: "Name Desc" });
  await expect(firstTitle(jobs)).toContainText("Various Freelance");

  await select.selectOption({ label: "Start Date Asc" });
  await expect(firstTitle(jobs)).toContainText(
    "Technician and LAN Administrator",
  );

  await select.selectOption({ label: "Start Date Desc" });
  await expect(firstTitle(jobs)).toContainText(
    "Senior Fullstack Engineer, GitLab",
  );

  await select.selectOption({ label: "End Date Asc" });
  await expect(firstTitle(jobs)).toContainText(
    "Technician and LAN Administrator",
  );

  await select.selectOption({ label: "End Date Desc" });
  await expect(firstTitle(jobs)).toContainText(
    "Senior Fullstack Engineer, GitLab",
  );
});

test("items with no start date sort as the earliest instant", async ({
  page,
}) => {
  await open(page, HOME);
  const openSource = section(page, OPEN_SOURCE);
  const select = openSource.getByRole("combobox");

  // "Other random open source stuff" has no start date: it sorts first under
  // Start Date Asc (earliest instant)...
  await select.selectOption({ label: "Start Date Asc" });
  await expect(firstTitle(openSource)).toHaveText(
    "Other random open source stuff",
  );

  // ...and last under Start Date Desc.
  await select.selectOption({ label: "Start Date Desc" });
  await expect(lastTitle(openSource)).toHaveText(
    "Other random open source stuff",
  );
});

test("items with no end date sort as current", async ({ page }) => {
  await open(page, HOME);
  const jobs = section(page, "job-history");
  const select = jobs.getByRole("combobox");

  // The GitLab role has no end date: treated as current, it sorts last under
  // End Date Asc...
  await select.selectOption({ label: "End Date Asc" });
  await expect(lastTitle(jobs)).toContainText(
    "Senior Fullstack Engineer, GitLab",
  );

  // ...and first under End Date Desc.
  await select.selectOption({ label: "End Date Desc" });
  await expect(firstTitle(jobs)).toContainText(
    "Senior Fullstack Engineer, GitLab",
  );
});

test("items with equal dates break ties by item name", async ({ page }) => {
  await open(page, HOME);
  const education = section(page, "formal-education");
  const select = education.getByRole("combobox");

  // Both Formal Education items start 1990-08-02: an ascending date sort breaks
  // the tie by ascending item name...
  await select.selectOption({ label: "Start Date Asc" });
  await expect(async () => {
    expect(await itemTitles(education)).toEqual([
      "Associate in Pre Business",
      "Bachelor of Business Administration, with Honors, Business Computer Systems",
    ]);
  }).toPass();

  // ...and a descending date sort breaks the tie by descending item name.
  await select.selectOption({ label: "Start Date Desc" });
  await expect(async () => {
    expect(await itemTitles(education)).toEqual([
      "Bachelor of Business Administration, with Honors, Business Computer Systems",
      "Associate in Pre Business",
    ]);
  }).toPass();
});
