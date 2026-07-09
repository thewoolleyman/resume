import { loadResumeOrError } from "$lib/page";

import type { PageServerLoad } from "./$types";

// Build-time governed-data load for static mode (prerendered per +layout.ts).
export const load: PageServerLoad = () => ({ resume: loadResumeOrError() });
