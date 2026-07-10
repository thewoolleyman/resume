import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { loadResumeData } from "./resume";

// Pinned SHA-256 of the committed production snapshot — the redacted on-disk
// content, NOT the retrieved source (SPECIFICATION/spec.md §"Governed data
// source and predecessor import (phase 1)"). The pre-redaction retrieved-source
// hash (792097b0…) is retained in the file's provenance comments; this pins the
// committed-snapshot hash after the 2026-07-10 owner-directed postal-address
// redaction from header.contact.
const PINNED_SHA256 =
  "20600aea8cdb06d797904921eb0259b96663a4a1acfaba1aa3265fccf5607c9e";
const SOURCE_HOST = "interactive-resume-data-chad-woolley.gitlab.io";
// Vitest runs with cwd at the repository root; import.meta.url is not
// guaranteed to be a file: URL under Vite, so resolve from cwd instead.
const resumePath = resolve(process.cwd(), "data/resume.yml");

describe("predecessor import", () => {
  it("preserves the predecessor about/header/section data shape", () => {
    const result = loadResumeData();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(`load failed: ${result.error.kind}`);
    }
    const { profile, sections } = result.value;

    expect(profile.about.title).toBe("About This Resume/App");
    expect(profile.about.contentMarkdown).toContain("## Cover Letter");
    expect(profile.about.contentHtml).toContain("<h2");
    expect(profile.header.name).toBe("Chad Woolley");
    expect(profile.header.contact).toContain("thewoolleyman@gmail.com");

    // Each section is named from its governed data group and carries a stable
    // slug id + ordered items with the predecessor per-item fields.
    for (const section of sections) {
      expect(section.name.length).toBeGreaterThan(0);
      expect(section.id).toMatch(/^[a-z0-9-]+$/);
      for (const item of section.items) {
        expect(item.id).toMatch(/^[a-z0-9-]+$/);
        expect(item.title.length).toBeGreaterThan(0);
        expect(typeof item.descriptionMarkdown).toBe("string");
        expect(item.descriptionHtml).toBeDefined();
      }
    }

    // A representative item preserves level + dates through the transform.
    const jobHistory = sections.find((s) => s.name === "Job History");
    const gitlab = jobHistory?.items.find((i) =>
      i.title.includes("Senior Fullstack Engineer, GitLab"),
    );
    expect(gitlab?.start).toBe("2019-11-07");
    expect(gitlab?.end).toBeNull();
  });

  it("transcribes the predecessor production content into data/resume.yml", () => {
    const bytes = readFileSync(resumePath);
    // Everything from the YAML document marker `---` to EOF must be
    // byte-identical to the retrieved production source (its pinned SHA-256).
    const markerOffset = bytes.indexOf("\n---\n");
    expect(markerOffset).toBeGreaterThan(0);
    const snapshot = bytes.subarray(markerOffset + 1);
    const sha = createHash("sha256").update(snapshot).digest("hex");
    expect(sha).toBe(PINNED_SHA256);

    // The provenance is recorded in the leading comment block (not a parsed
    // data group).
    const header = bytes.subarray(0, markerOffset).toString("utf8");
    expect(header).toContain(PINNED_SHA256);
    expect(header).toContain(SOURCE_HOST);
    expect(header).toContain("2022-06-27");
    expect(header).toContain("2026-07-06");
  });
});
