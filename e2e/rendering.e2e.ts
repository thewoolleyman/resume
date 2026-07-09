import { expect, test } from "@playwright/test";

import { HOME, open, section } from "./helpers";

const NBSP = "\u00A0";

test("item dates render in the predecessor M.YYYY format with until/current fallbacks", async ({
  page,
}) => {
  await open(page, HOME);

  // Present start and end: the Pivotal item (2006-04-15 / 2019-10-29) renders
  // `4.2006<nbsp>-` in the start position and bare `10.2019` in the end.
  const pivotal = page.locator("#job-history-senior-software-engineer-pivotal");
  expect(await pivotal.locator(".date-start").textContent()).toBe(
    `4.2006${NBSP}-`,
  );
  expect(await pivotal.locator(".date-end").textContent()).toBe("10.2019");

  // Present start, missing end: the GitLab role renders its start and `current`
  // in the end position.
  const gitlab = page.locator("#job-history-senior-fullstack-engineer-gitlab");
  expect(await gitlab.locator(".date-start").textContent()).toBe(
    `11.2019${NBSP}-`,
  );
  expect(await gitlab.locator(".date-end").textContent()).toBe("current");

  // Missing start and end: a level-only skill item renders nothing in the start
  // position and `current` in the end.
  const growthLean = section(
    page,
    "skills-tools-methodologies-processes",
  ).locator('[data-testid="item"]', {
    has: page.getByText("Growth / Lean", { exact: true }),
  });
  expect(await growthLean.locator(".date-start").textContent()).toBe("");
  expect(await growthLean.locator(".date-end").textContent()).toBe("current");
});
