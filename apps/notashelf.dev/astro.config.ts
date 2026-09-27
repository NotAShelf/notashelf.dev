// @ts-check
import { defineConfig } from "astro/config";

// First party integrations
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";

// Personal integrations or plugins
import mathjax from "astro-mathjax";
import purgeCss from "astro-purge-css";
import emailObfuscation from "astro-email-obfuscation";
import copyrightYearPlugin from "vite-copyright-replace";
import remarkEmDash from "remark-em-dash";

// Third Party integrations or plugins
import icon from "astro-icon";
import expressiveCode from "astro-expressive-code";
import postcssNormalize from "postcss-normalize";
import type { AcceptedPlugin } from "postcss";
import postcssPresetEnv from "postcss-preset-env";

import remarkToc from "remark-toc";
import rehypeExternalLinks from "rehype-external-links";

// The normalize typings model an object, but the package exports a PostCSS factory.
const normalizePlugin = postcssNormalize as unknown as AcceptedPlugin;

// https://astro.build/config
export default defineConfig({
  site: "https://notashelf.dev",
  trailingSlash: "never",
  devToolbar: {
    enabled: false,
  },

  redirects: {
    "/blog": "/posts",
  },

  image: {
    remotePatterns: [{ protocol: "https" }],
  },

  experimental: {
    clientPrerender: true,
  },

  // https://docs.astro.build/en/reference/configuration-reference/
  integrations: [
    sitemap(),
    icon(),
    expressiveCode({
      themes: ["one-dark-pro"],
      frames: false,
      defaultProps: {
        wrap: true,
      },

      shiki: {
        bundledLangs: [
          // Only the languages I plan to talk about
          "nix",
          "rust",
          "astro",
          "javascript",
          "typescript",
          "go",
          "zig",
          "c",
          "json",
        ],
      },
    }),
    svelte(),
    mathjax(),
    mdx(),

    emailObfuscation({
      methods: ["rot18"],
      placeholder: "me @ domain",
    }),

    purgeCss({
      safelist: [
        "archive-banner",
        "visible",
        "animate",
        // PostToc.svelte: applied via class="" template strings and class:active directive
        "toc-item",
        "toc-sidebar-item",
        "level-2",
        "level-3",
        "active",
        // PostSearch.svelte: class:disabled on pagination links
        "disabled",
      ],
      postcss: {
        plugins: [
          normalizePlugin,
          postcssPresetEnv({
            browsers: ["> 1%", "last 2 versions"],
            stage: 3,
            features: {
              "nesting-rules": true,
              "custom-media-queries": true,
              "media-query-ranges": true,
            },
          }),
        ],
      },

      cssnano: {
        preset: [
          "default",
          {
            discardComments: { removeAll: true },
            reduceIdents: false,
            zindex: false,
          },
        ],
      },
    }),
  ],

  markdown: {
    processor: unified({
      gfm: true,
      smartypants: true,
      remarkPlugins: [remarkEmDash, [remarkToc, { heading: "contents" }]],
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
  },

  // Enable prefetching for internal links with data-astro-prefetch.
  prefetch: true,

  vite: {
    // Variables used by the build process. We can easily pass values to those with Nix
    // during the build process, so this is deterministic and clean.
    define: {
      "import.meta.env.GIT_REV": JSON.stringify(process.env.GIT_REV || "main"),
      "import.meta.env.SITE_SRC": JSON.stringify(
        process.env.SITE_SRC || "https://github.com/notashelf/notashelf.dev",
      ),
      "import.meta.env.BUILD_DATE": JSON.stringify(
        process.env.BUILD_DATE || new Date(),
      ),
    },

    plugins: [
      // Replaces copyright variables during the build process. This is more performant
      // compared to embedding some minor JS code to replace it dynamically.
      copyrightYearPlugin(),
    ],

    // Terser compresses the static client bundles without unsafe transformations.
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          passes: 2,
          drop_console: true,
          drop_debugger: true,
        },

        format: {
          comments: true,
        },
      },
    },
  },
});
