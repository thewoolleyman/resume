import { expect, test } from "@playwright/test";

import { HOME, items, open, section, stickyNav, TOTAL_ITEMS } from "./helpers";

// The sixteen governed sections in canonical order (spec.md §"Governed data
// source"): the top-level YAML keys after `about`/`header`, in file order.
const SECTION_NAMES = [
  "Job History",
  "Formal Education",
  "Open-Source Projects Created/Contributed",
  "Writings, Publications, Presentations, and Awards",
  "Skills/Tools - Methodologies/Processes",
  "Skills/Tools - Frontend Languages/Libs/Frameworks",
  "Skills/Tools - Backend Languages/Libs/Frameworks",
  "Skills/Tools - Databases",
  "Skills/Tools - DevOps/SecOps/OS/Sysadmin",
  "Skills/Tools - Editors/IDEs",
  "Skills/Tools - Remote Working",
  "Skills/Tools - Networking",
  "Skills/Tools - Source Control",
  "Skills/Tools - Legacy/Mainframe",
  "Favorite Books/Articles",
  "Personal Info",
];

test("visitor opens the interactive resume and sees profile, navigation, and items", async ({
  page,
}) => {
  await open(page, HOME);

  // Profile header rendered from governed data.
  await expect(page.locator(".resume-name")).toHaveText("Chad Woolley");
  await expect(page.locator(".resume-contact")).toContainText(
    "thewoolleyman@gmail.com",
  );

  // Sticky navigation bar with its controls.
  await expect(stickyNav(page)).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "Search resume" }),
  ).toBeVisible();

  // Resume items rendered from the governed data.
  await expect(items(page)).toHaveCount(TOTAL_ITEMS);
});

test("renders prerendered navigation, header shell, and sections without a blank page", async ({
  page,
}) => {
  // Read the prerendered HTML directly (JS disabled) so we assert the response
  // is baked, not runtime-fetched: no loading indicator, no blank page.
  const response = await page.request.get(HOME);
  const html = await response.text();

  expect(html).toContain("sticky-nav");
  expect(html).toContain("resume-header");
  expect(html).toContain("Chad Woolley");
  // The first governed section and a known deep-link item id are present in the
  // baked markup — the render did not defer to a runtime fetch.
  expect(html).toContain("Job History");
  expect(html).toContain("job-history-senior-software-engineer-pivotal");
});

test("preserves governed section names and order", async ({ page }) => {
  await open(page, HOME);

  const headings = await page
    .locator("main.resume-main .section-name")
    .allInnerTexts();
  expect(headings.map((text) => text.trim())).toEqual(SECTION_NAMES);

  // The first section's first item is the first governed Job History entry —
  // items keep governed order by default.
  const firstItem = section(page, "job-history")
    .locator('[data-testid="item"] .item-title')
    .first();
  await expect(firstItem).toHaveText("Staff Fullstack Engineer, GitLab");
});
