import { describe, expect, it } from "vitest";

import { load } from "./+layout";

describe("root layout load", () => {
  it("derives the canonical from the route path, not the request origin", async () => {
    // A preview/branch deployment serves /static from a *.vercel.app origin, but
    // its canonical MUST still resolve to production /static so a preview URL is
    // never presented as canonical (constraints.md §"Framework and deployment").
    const event = {
      url: new URL("https://resume-preview.vercel.app/static"),
    } as unknown as Parameters<typeof load>[0];
    expect(await load(event)).toEqual({
      canonical: "https://resume.thewoolleyweb.com/static",
    });
  });
});
