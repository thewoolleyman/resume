// Phase-1 reads governed data at build/prerender time and bakes it into the
// prerendered response (SPECIFICATION/constraints.md §"Performance and
// availability"), so every route is prerendered and performs no runtime fetch.
export const prerender = true;
