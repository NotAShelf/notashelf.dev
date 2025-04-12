import { defineConfig } from "astro/config";
import { remarkHeadingIds, remarkTitleHeadings, remarkEmDash } from "./src/lib";
import mdx from "@astrojs/mdx";
import remarkToc from "remark-toc";
import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

import partytown from "@astrojs/partytown";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://notashelf.dev",
  trailingSlash: "never",
  // https://docs.astro.build/en/reference/configuration-reference/
  integrations: [mdx({
    remarkPlugins: [
      remarkHeadingIds,
      remarkEmDash,
      remarkTitleHeadings,
      [remarkToc, { heading: "contents" }],
    ],
  }), react(), sitemap(), partytown()],
  markdown: {
    remarkPlugins: [
      remarkHeadingIds,
      remarkEmDash,
      remarkTitleHeadings,
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
});