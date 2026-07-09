import { expect, test } from "@playwright/test";

import { HOME, itemTitles, open, section } from "./helpers";

const METHODOLOGIES = "skills-tools-methodologies-processes";

test("toggling skill levels shows and hides only items at that level", async ({
  page,
}) => {
  await open(page, HOME);
  const methodologies = section(page, METHODOLOGIES);

  const skillLevels = page.locator("details.nav-menu", {
    has: page.getByText("Skill Levels", { exact: true }),
  });
  await skillLevels.locator("summary").click();

  // The control starts with all six levels selected and explains each meaning.
  const checkboxes = skillLevels.getByRole("checkbox");
  await expect(checkboxes).toHaveCount(6);
  for (let i = 0; i < 6; i += 1) {
    await expect(checkboxes.nth(i)).toBeChecked();
  }
  await expect(skillLevels).toContainText(
    "I have played around with it for fun",
  );

  // The Methodologies section has nine items, four of them at level `teach`.
  await expect(methodologies.locator('[data-testid="item"]')).toHaveCount(9);
  await expect(
    methodologies.locator("abbr.level-badge").filter({ hasText: /^teach$/ }),
  ).toHaveCount(4);

  // Deselecting `teach` hides only the four teach items; the other five remain.
  await skillLevels
    .locator("label", { hasText: "teach" })
    .getByRole("checkbox")
    .click();
  await expect(async () => {
    expect(await itemTitles(methodologies)).toEqual([
      "Growth / Lean",
      "Event Sourcing (ES)",
      "Command Query Response Segregation (CQRS)",
      "Patterns/Architectures",
      "Other Tools",
    ]);
  }).toPass();
  await expect(
    methodologies.locator("abbr.level-badge").filter({ hasText: /^teach$/ }),
  ).toHaveCount(0);

  // Re-selecting `teach` restores all nine items.
  await skillLevels
    .locator("label", { hasText: "teach" })
    .getByRole("checkbox")
    .click();
  await expect(methodologies.locator('[data-testid="item"]')).toHaveCount(9);

  // Items with no level (Job History) render no level badge.
  await expect(
    section(page, "job-history").locator("abbr.level-badge"),
  ).toHaveCount(0);
});
