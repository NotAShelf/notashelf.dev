import { defineConfig } from "astro/config";
import { fileURLToPath, URL } from "node:url";
import { remarkEmDash } from "./src/lib";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import rehypeExternalLinks from "rehype-external-links";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { copyrightYearPlugin } from "vite-copyright-replace";
import purgeCss from "astro-purge-css";
import emailObfuscation from "astro-email-obfuscation";

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

    // Home-Baked Integrations
    emailObfuscation({ method: "rot13" }),
    purgeCss({
      safelist: ["safe-class"],
      blocklist: ["blocked-class"],
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
    resolve: {
      alias: {
        "wasm-utils": fileURLToPath(
          new URL("../../packages/wasm-utils/pkg", import.meta.url),
        ),
      },
    },
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
      // Enable minification and source maps for better compression
      // XXX: Terser is 10-20ms slower, but roughly 1% at compression.
      // I don't quite know if this is worth the cost, but might as well.
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
            regex: /^_/, // Mangle properties starting with underscore
          },
        },
        format: {
          comments: false,
        },
      },
    },
    optimizeDeps: {
      exclude: ["wasm-utils"],
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
