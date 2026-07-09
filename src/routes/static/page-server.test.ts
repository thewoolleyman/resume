import type { ResumeData } from "$lib/data/types";

import { describe, expect, it } from "vitest";

import { load } from "./+page.server";

describe("static route load", () => {
  it("loads the governed resume data at prerender time", async () => {
    const { resume } = (await load(
      {} as unknown as Parameters<typeof load>[0],
    )) as { resume: ResumeData };
    expect(resume.sections).toHaveLength(16);
  });
});
