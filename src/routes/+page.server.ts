import { loadResumeOrError } from "$lib/page";

import type { PageServerLoad } from "./$types";

// Build-time governed-data load for interactive mode (prerendered per
// +layout.ts). A malformed source fails the build via loadResumeOrError.
export const load: PageServerLoad = () => ({ resume: loadResumeOrError() });
