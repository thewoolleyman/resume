import { expect, test } from "@playwright/test";

import { HOME, open, section } from "./helpers";

test("collapsing hides section rows while keeping the header, and expanding restores them", async ({
  page,
}) => {
  await open(page, HOME);
  const jobs = section(page, "job-history");
  const rows = jobs.locator('[data-testid="item"]');
  const toggle = jobs.locator(".collapse-toggle");

  // Expanded to start: all eight rows visible.
  await expect(rows).toHaveCount(8);
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  // Collapsing hides the rows but keeps the header and its offset anchor.
  await toggle.click();
  await expect(rows).toHaveCount(0);
  await expect(page.locator("#heading-job-history")).toBeVisible();
  await expect(page.locator("span#job-history")).toHaveCount(1);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  // Expanding restores the rows.
  await toggle.click();
  await expect(rows).toHaveCount(8);
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
});
