// SvelteKit configuration per SPECIFICATION/constraints.md §"Framework and
// deployment": Svelte + SvelteKit with the Vercel adapter and build-time
// prerendering. Phase-1 reads governed data at build/prerender time and bakes
// it into the prerendered interactive and static output.
import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // The whole app is prerendered to static output; the runtime is pinned to
    // a Vercel-supported Node version so the adapter resolves it independently
    // of the local build machine's Node version.
    adapter: adapter({ runtime: "nodejs22.x" }),
    alias: {
      $data: "data",
    },
  },
};

export default config;
