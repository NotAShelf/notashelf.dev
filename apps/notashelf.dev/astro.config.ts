// @ts-check
import { defineConfig } from "astro/config";

// First party integrations
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";
import svelte from "@astrojs/svelte";

// Personal integrations or plugins
import plausible from "astro-plausible";
import purgeCss from "astro-purge-css";
import emailObfuscation from "astro-email-obfuscation";
import copyrightYearPlugin from "vite-copyright-replace";
import remarkEmDash from "remark-em-dash";

// Third Party integrations or plugins
import icon from "astro-icon";
import expressiveCode from "astro-expressive-code";
import postcssNormalize from "postcss-normalize";
import postcssPresetEnv from "postcss-preset-env";
import autoprefixer from "autoprefixer";

import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import rehypeExternalLinks from "rehype-external-links";

import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://astro.build/config
export default defineConfig({
  site: "https://notashelf.dev",
  output: "static",
  trailingSlash: "never",
  devToolbar: {
    enabled: false,
  },

  redirects: {
    "/blog": "/posts",
  },

  image: {
    remotePatterns: [{ protocol: "https" }],
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },

  build: {
    inlineStylesheets: "auto",
    assets: "_astro",
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
    partytown({
      config: {
        forward: ["plausible"],
        resolveUrl: (url) => {
          if (url.hostname === "pl.notashelf.dev") {
            return url;
          }

          return url;
        },
      },
    }),
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

    // Home-Baked Integrations
    plausible({
      domain: "notashelf.dev",
      src: "https://pl.notashelf.dev/js/script.file-downloads.hash.outbound-links.pageview-props.tagged-events.js",
      withPartytown: true,
      excludeHash: true,
      excludeSearch: true,
    }),

    emailObfuscation({
      methods: ["js-interaction", "rot18"],
      placeholder: "me @ domain",
    }),

    purgeCss({
      safelist: ["safe-class"],
      blocklist: ["blocked-class"],
      postcss: {
        options: {
          from: undefined,
          to: undefined,
        },
        plugins: [
          postcssNormalize() as any, // yuck
          autoprefixer({
            overrideBrowserslist: ["> 1%", "last 2 versions"],
          }),

          postcssNormalize as any,
          [
            postcssPresetEnv,
            {
              stage: 3,
              features: {
                "nesting-rules": true,
                "custom-media-queries": true,
                "media-query-ranges": true,
              },
            },
          ],
        ],
      },

      cssnano: {
        preset: [
          "default",
          {
            discardComments: {
              removeAll: true,
            },
            normalizeWhitespace: true,
            mergeLonghand: true,
            mergeRules: true,
            minifySelectors: true,
            minifyParams: true,
            minifyFontValues: true,
            colormin: true,
            convertValues: true,
            discardDuplicates: true,
            discardEmpty: true,
            discardOverridden: true,
            normalizeUrl: true,
            reduceIdents: false,
            zindex: false,
          },
        ],
      },
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
  },

  // Prefetch configuration
  // https://docs.astro.build/en/reference/configuration-reference/#prefetch-options
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },

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

      // WASM support for Vite. WASM is a sandbox experiment.
      // <https://www.npmjs.com/package/vite-plugin-wasm>
      wasm(),
      topLevelAwait(),
    ],

    // Aggressively optimise Vite's build process. Terser is 1-3% slower, but it produces
    // roughly 10% smaller results. Since we deploy this site exclusively on system switches
    // the speed hit is not critical. It's a static site, not my super-epic online e-commerce.
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          passes: 2,
          unsafe_arrows: true,
          unsafe_methods: true,
          unsafe_proto: true,
          unsafe_regexp: true,
          drop_console: true,
          drop_debugger: true,
          pure_funcs: [
            "console.log",
            "console.info",
            "console.debug",
            "console.warn",
          ],
        },

        mangle: {
          properties: {
            regex: /^_/,
          },
        },

        format: {
          comments: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            wasm: ["wasm-utils"],
          },
        },
      },
    },
  },
});
