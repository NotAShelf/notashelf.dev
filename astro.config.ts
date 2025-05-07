import { defineConfig } from "astro/config";
import { remarkEmDash } from "./src/lib";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import rehypeExternalLinks from "rehype-external-links";

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";

// https://astro.build/config
export default defineConfig({
  site: "https://notashelf.dev",
  output: "static",
  trailingSlash: "never",
  devToolbar: {
    enabled: false,
  },

  image: {
    service: {
      entrypoint: "astro/assets/services/sharp"
    }
  },

  // https://docs.astro.build/en/reference/configuration-reference/
  integrations: [
    react(),
    sitemap(),
    partytown(),
    mdx({
      gfm: true,
      smartypants: true,
      remarkPlugins: [
        remarkEmDash,
        remarkGfm,
        [remarkToc, { heading: "contents" }],
      ],
      rehypePlugins: [
        [
          rehypeExternalLinks,
          {
            target: "_blank",
            rel: ["nofollow", "noopener", "noreferrer"],
          },
        ],
      ],
    }),
  ],
  markdown: {
    gfm: true,
    smartypants: true,
    remarkPlugins: [
      remarkEmDash,
      remarkGfm,
      [remarkToc, { heading: "contents" }],
    ],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["nofollow", "noopener", "noreferrer"],
        },
      ],
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
});
