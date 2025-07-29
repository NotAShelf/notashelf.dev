// @ts-check
import { defineConfig } from "astro/config";

// First party integrations
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
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
    react(),
    sitemap(),
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

    shikiConfig: {
      theme: "one-dark-pro",
      langs: [],
      wrap: true,
    },
  },

  // Prefetch configuration
  // https://docs.astro.build/en/reference/configuration-reference/#prefetch-options
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },

  vite: {
    plugins: [wasm(), topLevelAwait(), copyrightYearPlugin()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            fontawesome: [
              "@fortawesome/react-fontawesome",
              "@fortawesome/fontawesome-svg-core",
            ],
            wasm: ["wasm-utils"],
          },
        },
      },
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: [
            "console.log",
            "console.info",
            "console.debug",
            "console.warn",
          ],
          passes: 2,
          unsafe_arrows: true,
          unsafe_methods: true,
          unsafe_proto: true,
          unsafe_regexp: true,
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
    },
    optimizeDeps: {
      exclude: ["wasm-utils"],
    },
    define: {
      "import.meta.env.GIT_REV": JSON.stringify(process.env.GIT_REV || "main"),
      "import.meta.env.SITE_SRC": JSON.stringify(
        process.env.SITE_SRC || "https://github.com/notashelf/notashelf.dev",
      ),
      "import.meta.env.BUILD_DATE": JSON.stringify(
        process.env.BUILD_DATE || new Date(),
      ),
    },
  },
});
