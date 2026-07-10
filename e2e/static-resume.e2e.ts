import { expect, test } from "@playwright/test";

import { items, open, STATIC, TOTAL_ITEMS } from "./helpers";

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

test("static mode renders all governed data in canonical order, fully expanded", async ({
  page,
}) => {
  await open(page, STATIC);

  // Profile and about, rendered from governed data.
  await expect(page.locator("article.static-resume h1")).toHaveText(
    "Chad Woolley",
  );
  await expect(page.locator("#static-about-title")).toHaveText(
    "About This Resume/App",
  );

  // A print-friendly cross-link back to the interactive resume, carrying its
  // full canonical URL so a printed/PDF copy stays actionable.
  const cross = page.getByTestId("static-crosslink");
  await expect(cross).toContainText("Static version");
  await expect(cross.locator("a")).toHaveAttribute(
    "href",
    "https://resume.thewoolleyweb.com/",
  );

  // The shared About body no longer frames itself as only the interactive view.
  await expect(page.locator(".static-about")).not.toContainText(
    "interactive resume",
  );

  // No interactive chrome: no sticky nav, search, sort, or collapse controls —
  // everything is expanded and visible without JS-only disclosure.
  await expect(page.locator("nav.sticky-nav")).toHaveCount(0);
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.locator(".collapse-toggle")).toHaveCount(0);
  await expect(page.locator("select")).toHaveCount(0);

  // Every section in canonical governed order, and all 74 items present.
  const headings = await page
    .locator("section.static-section > h2")
    .allInnerTexts();
  expect(headings.map((text) => text.trim())).toEqual(SECTION_NAMES);
  await expect(items(page)).toHaveCount(TOTAL_ITEMS);

  // Item levels, dates, and markdown links are preserved: the Pivotal item
  // shows its predecessor dates, and a governed markdown link renders as an
  // anchor to its public URL.
  const pivotal = page.locator("#job-history-senior-software-engineer-pivotal");
  await expect(pivotal.locator(".date-end")).toHaveText("10.2019");
  await expect(pivotal.locator("abbr.level-badge")).toHaveCount(0);
  await expect(
    page.locator(
      'article.static-resume a[href="http://theleanstartup.com/principles"]',
    ),
  ).toHaveCount(1);
});

test("static mode is served fully baked without a runtime fetch", async ({
  page,
}) => {
  // The prerendered response already carries every section and item id — no
  // blank shell awaiting a runtime data fetch.
  const html = await (await page.request.get(STATIC)).text();
  expect(html).toContain("static-resume");
  expect(html).toContain("Chad Woolley");
  expect(html).toContain("job-history-senior-software-engineer-pivotal");
  expect(html).toContain("Personal Info");
});
