// Test-only ResumeData fixture (excluded from coverage; __fixtures__ is not
// product source). A small, controlled dataset for component/route tests.
import type { ResumeData, ResumeItem } from "$lib/data/types";

function item(
  overrides: Partial<ResumeItem> & { id: string; title: string },
): ResumeItem {
  return {
    level: null,
    start: null,
    end: null,
    startDisplay: "",
    endDisplay: "current",
    startSortKey: 0,
    endSortKey: 0,
    descriptionMarkdown: "",
    descriptionHtml: "<p>desc</p>",
    searchText: overrides.title,
    ...overrides,
  };
}

export function makeResumeData(): ResumeData {
  const jobs: ResumeItem[] = [
    item({
      id: "job-history-alpha",
      title: "Alpha Role",
      level: "teach",
      searchText: "Alpha Role ruby",
      startSortKey: 200,
    }),
    item({
      id: "job-history-bravo",
      title: "Bravo Role",
      level: "played",
      searchText: "Bravo Role javascript",
      startSortKey: 100,
    }),
  ];
  const skills: ResumeItem[] = [
    item({
      id: "skills-testing",
      title: "Testing",
      level: "teach",
      searchText: "Testing ruby",
    }),
  ];
  return {
    profile: {
      about: {
        title: "About This Resume",
        contentMarkdown: "Hello **world**",
        contentHtml: "<p>Hello <strong>world</strong></p>",
      },
      header: { name: "Chad Woolley", contact: "somewhere@example.com" },
    },
    sections: [
      { id: "job-history", ordinal: 1, name: "Job History", items: jobs },
      { id: "skills", ordinal: 2, name: "Skills", items: skills },
    ],
    items: [...jobs, ...skills],
    skills: [],
    relationships: [],
    metadata: { sectionCount: 2, itemCount: 3, topLevelKeyCount: 4 },
  };
}
