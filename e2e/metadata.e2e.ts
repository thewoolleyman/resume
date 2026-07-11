import { expect, test } from "@playwright/test";

import {
  expectNoHorizontalScroll,
  HOME,
  metaContent,
  open,
  STATIC,
} from "./helpers";

const VIEWPORT = "width=device-width, initial-scale=1, shrink-to-fit=no";
const ORIGIN = "https://resume.thewoolleyweb.com";

test("interactive and static surfaces expose predecessor title, description, viewport, icons, and manifest", async ({
  page,
}) => {
  for (const path of [HOME, STATIC]) {
    await open(page, path);

    // Title and description.
    await expect(page).toHaveTitle("Chad Woolley - Resume");
    expect(await metaContent(page, "description")).toContain("resume");

    // Viewport metadata, verbatim from the predecessor.
    expect(await metaContent(page, "viewport")).toBe(VIEWPORT);

    // Robots + canonical consistent with the preview-non-index rule. Each route
    // self-canonicalizes to its OWN production URL (/ → /, /static → /static);
    // the absolute production origin keeps preview deployments non-canonical
    // (F3 live-review finding; constraints.md §"Framework and deployment").
    expect(await metaContent(page, "robots")).toBe("index, follow");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${ORIGIN}${path}`,
    );

    // Favicon and manifest links served.
    await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);

    // No horizontal scroll on a supported viewport.
    await expectNoHorizontalScroll(page);
  }

  // The web app manifest declares standalone display and app icons at least
  // equivalent to 192x192 and 512x512.
  const manifest = (await (
    await page.request.get("/manifest.webmanifest")
  ).json()) as { display: string; icons: { sizes?: string }[] };
  expect(manifest.display).toBe("standalone");
  const sizes = manifest.icons.map((icon) => icon.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");

  // robots.txt allows crawling and points at the sitemap, which lists both
  // canonical routes (F4 live-review finding).
  const robots = await (await page.request.get("/robots.txt")).text();
  expect(robots).toContain(
    "Sitemap: https://resume.thewoolleyweb.com/sitemap.xml",
  );
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://resume.thewoolleyweb.com/</loc>");
  expect(sitemap).toContain(
    "<loc>https://resume.thewoolleyweb.com/static</loc>",
  );
});
