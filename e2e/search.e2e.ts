import { expect, test } from "@playwright/test";

import {
  HOME,
  items,
  itemTitles,
  open,
  searchBox,
  section,
  TOTAL_ITEMS,
} from "./helpers";

const METHODOLOGIES = "skills-tools-methodologies-processes";

// Opens the Skill Levels control and toggles a level checkbox by its key.
async function toggleLevel(
  page: import("@playwright/test").Page,
  key: string,
): Promise<void> {
  const control = page.locator("details.nav-menu", {
    has: page.getByText("Skill Levels", { exact: true }),
  });
  await control.locator("summary").click();
  await control
    .locator("label", { hasText: key })
    .getByRole("checkbox")
    .click();
}

// Job History items in canonical governed order.
const JOB_ORDER = [
  "Senior Fullstack Engineer, GitLab",
  "Senior Software Engineer, Pivotal",
  "Various Freelance and Consulting Gigs",
  "Software Developer, Ionami Design",
  "Software Developer, VMS",
  "Developer, Choice Hotels International",
  "Application Integrator, IBM Global Services",
  "Technician and LAN Administrator, New Mexico State University, Department of Chemical Engineering,",
];

test("case-insensitive search filters items in canonical order with a no-results state", async ({
  page,
}) => {
  await open(page, HOME);

  // Case-insensitive: a lowercase query matches the mixed-case governed title.
  await searchBox(page).fill("pivotal");
  await expect(
    section(page, "job-history").locator('[data-testid="item"] .item-title', {
      hasText: "Senior Software Engineer, Pivotal",
    }),
  ).toBeVisible();

  // Partial matches (from name or stripped description) stay in canonical
  // governed order — the surviving titles are the governed order filtered to
  // the matches, never reordered.
  await searchBox(page).fill("developer");
  await expect(async () => {
    const visible = await itemTitles(section(page, "job-history"));
    expect(visible.length).toBeGreaterThan(0);
    expect(visible).toEqual(
      JOB_ORDER.filter((title) => visible.includes(title)),
    );
  }).toPass();

  // Clearing the query restores the full default-ordered view.
  await searchBox(page).fill("");
  await expect(items(page)).toHaveCount(TOTAL_ITEMS);

  // A term with no matches shows an explicit no-results state and no items.
  await searchBox(page).fill("zzznomatchzzz");
  await expect(items(page)).toHaveCount(0);
  await expect(page.getByTestId("no-results").first()).toBeVisible();
});

test("search matches markdown-stripped prose but not markdown/HTML syntax", async ({
  page,
}) => {
  await open(page, HOME);
  const growthLean = section(page, METHODOLOGIES).locator(
    '[data-testid="item"]',
    { has: page.getByText("Growth / Lean", { exact: true }) },
  );

  // "practices" is plain prose in the Growth / Lean description → it matches.
  await searchBox(page).fill("practices");
  await expect(growthLean).toBeVisible();

  // "principles" appears only inside the markdown link URL
  // (http://theleanstartup.com/principles) → the stripped projection excludes
  // it, so it does not match.
  await searchBox(page).fill("principles");
  await expect(growthLean).toBeHidden();
});

test("validated matches only Growth / Lean and theleanstartup matches nothing", async ({
  page,
}) => {
  await open(page, HOME);

  // The pinned worked example: `validated` matches exactly the Growth / Lean
  // item in the Methodologies section and no other item.
  await searchBox(page).fill("validated");
  await expect(items(page)).toHaveCount(1);
  const match = items(page).first();
  await expect(match.locator(".item-title")).toHaveText("Growth / Lean");
  await expect(
    section(page, METHODOLOGIES).locator('[data-testid="item"]'),
  ).toHaveCount(1);

  // `theleanstartup` appears only inside markdown URL syntax → no matches.
  await searchBox(page).fill("theleanstartup");
  await expect(items(page)).toHaveCount(0);
});

test("a no-match search keeps section headers with empty rows and a no-results state", async ({
  page,
}) => {
  await open(page, HOME);

  await searchBox(page).fill("zzznomatchzzz");

  // Section structure survives: all sixteen headers remain visible.
  await expect(page.locator("main.resume-main .section-name")).toHaveCount(16);
  // Every section body shows the explicit no-results row, and no item rows.
  await expect(page.getByTestId("no-results")).toHaveCount(16);
  await expect(items(page)).toHaveCount(0);
});

test("search then skill-level filter then section sort compose in that order", async ({
  page,
}) => {
  await open(page, HOME);
  const methodologies = section(page, METHODOLOGIES);

  // 1) Query restricts the section to its matches, in canonical order:
  //    Growth / Lean (often), Event Sourcing (once), CQRS (played).
  await searchBox(page).fill("have");
  await expect(async () => {
    expect(await itemTitles(methodologies)).toEqual([
      "Growth / Lean",
      "Event Sourcing (ES)",
      "Command Query Response Segregation (CQRS)",
    ]);
  }).toPass();

  // 2) Deselecting `played` hides CQRS, leaving the query matches in canonical
  //    order still (the sort has not been applied yet).
  await toggleLevel(page, "played");
  await expect(async () => {
    expect(await itemTitles(methodologies)).toEqual([
      "Growth / Lean",
      "Event Sourcing (ES)",
    ]);
  }).toPass();

  // 3) The section sort orders the surviving filtered set: Name Asc puts Event
  //    Sourcing before Growth / Lean.
  await methodologies.getByRole("combobox").selectOption({ label: "Name Asc" });
  await expect(async () => {
    expect(await itemTitles(methodologies)).toEqual([
      "Event Sourcing (ES)",
      "Growth / Lean",
    ]);
  }).toPass();
});
