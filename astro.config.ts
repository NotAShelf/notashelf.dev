import { defineConfig } from "astro/config";
import { remarkHeadingIds, remarkEmDash } from "./src/remark";
import mdx from "@astrojs/mdx";
import remarkToc from "remark-toc";
import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://notashelf.dev",
  trailingSlash: "never",
  // https://docs.astro.build/en/reference/configuration-reference/
  integrations: [mdx({
    remarkPlugins: [
      remarkHeadingIds,
      [remarkToc, { heading: "contents" }],
      remarkEmDash,
    ],
  }), react(), sitemap()],
  markdown: {
    remarkPlugins: [
      remarkHeadingIds,
      remarkEmDash,

      [remarkToc, { heading: "contents" }],
    ],
    shikiConfig: {
      theme: "one-dark-pro",
      langs: [],
      wrap: true,
    },
  },
  // https://docs.astro.build/en/reference/configuration-reference/#prefetch-options
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  devToolbar: {
    enabled: false,
  },
  content: {
    directory: "content",
  },
});