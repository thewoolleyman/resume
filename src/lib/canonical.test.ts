import { describe, expect, it } from "vitest";

import { canonicalHref, PRODUCTION_ORIGIN } from "./canonical";

describe("canonicalHref", () => {
  it("maps a route path to its absolute production URL", () => {
    expect(canonicalHref("/")).toBe("https://resume.thewoolleyweb.com/");
    expect(canonicalHref("/static")).toBe(
      "https://resume.thewoolleyweb.com/static",
    );
  });

  it("always uses the pinned production origin", () => {
    expect(PRODUCTION_ORIGIN).toBe("https://resume.thewoolleyweb.com");
    expect(canonicalHref("/anything")).toBe(`${PRODUCTION_ORIGIN}/anything`);
  });
});
