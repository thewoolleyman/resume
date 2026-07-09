// The single governed-data entry point: reads the committed authoring-shape
// snapshot at build/prerender time (Vite `?raw` import, so no runtime fetch —
// SPECIFICATION/constraints.md §"Performance and availability") and transforms
// it into the resume data contract. The transform is memoized at module load;
// this is a core module, so the public accessor returns Result.
import rawResumeYaml from "$data/resume.yml?raw";

import type { DomainError } from "../errors";
import type { Result } from "../result";
import type { ResumeData } from "./types";

import { transformResume } from "./transform";

const transformed = transformResume(rawResumeYaml);

export function loadResumeData(): Result<ResumeData, DomainError> {
  return transformed;
}
