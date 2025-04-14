import { defineConfig } from "astro/config";
import { remarkEmDash } from "./src/lib";
import remarkToc from "remark-toc";
import remarkGfm from "remark-gfm";
import rehypeExternalLinks from "rehype-external-links";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://notashelf.dev",
  trailingSlash: "never",
  // https://docs.astro.build/en/reference/configuration-reference/
  integrations: [
    mdx({
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
            rel: ["nofollow, noopener, noreferrer"],
          },
        ],
      ],
    }),
    react(),
    sitemap(),
    partytown(),
  ],
  markdown: {
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
          rel: ["nofollow, noopener, noreferrer"],
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
  devToolbar: {
    enabled: false,
  },
});
