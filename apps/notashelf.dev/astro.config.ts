import { defineConfig } from "astro/config";
import { fileURLToPath, URL } from "node:url";
import { remarkEmDash } from "./src/lib";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import rehypeExternalLinks from "rehype-external-links";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";
import svelte from "@astrojs/svelte";

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
      entrypoint: "astro/assets/services/sharp",
    },
  },

  // https://docs.astro.build/en/reference/configuration-reference/
  integrations: [
    react(),
    sitemap(),
    partytown(),
    svelte(),
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

  vite: {
    plugins: [wasm(), topLevelAwait()],
    resolve: {
      alias: {
        "wasm-utils": fileURLToPath(
          new URL(
            "../../packages/wasm-utils/pkg/wasm-utils.js",
            import.meta.url,
          ),
        ),
      },
    },
    define: {
      // Inject environment variables for static builds. This makes it possible to respect
      // variables from the Nix build environment in the static build.
      "import.meta.env.GIT_REV": JSON.stringify(process.env.GIT_REV || "main"),
      "import.meta.env.SITE_SRC": JSON.stringify(
        process.env.SITE_SRC || "https://github.com/notashelf/notashelf.dev",
      ),
    },
  },
});
