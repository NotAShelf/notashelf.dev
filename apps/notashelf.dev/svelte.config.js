import { vitePreprocess } from "@astrojs/svelte";

/** @type {import('svelte').Config} */
let svelteConfig = {
  preprocess: vitePreprocess(),
};

export default svelteConfig;
