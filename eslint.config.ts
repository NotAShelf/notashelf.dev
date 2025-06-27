import eslint from "@eslint/js";
import eslintAstro from "eslint-plugin-astro";
import eslintSvelte from "eslint-plugin-svelte";

import globals from "globals";
import tseslint from "typescript-eslint";

import svelteConfig from "./apps/notashelf.dev/svelte.config.js";

const config = tseslint.config(
  // JavaScript
  eslint.configs.recommended,
  // TypeScript
  ...tseslint.configs.recommended,
  // Astro
  ...eslintAstro.configs["flat/recommended"],
  // Svelte
  ...eslintSvelte.configs.recommended,

  {
    // Global ignores
    ignores: [
      "**/dist/", // built site
      "**/node_modules/", // dependencies
      "**/.astro/", // astro state
      "**/.github/",
      "**/result/", // nix build artifacts
      "**/wasm-utils/**", // built WASM packages
      "**/pkg/**", // WASM pkg outputs
      "**/target/**", // Rust build artifacts
      "**/.stryker-tmp/**", // Stryker temporary files
    ],
  },

  {
    // Global rules
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  {
    // Allow triple-slash references in `*.d.ts` files.
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },

  {
    // Set globals for Node scripts.
    files: ["scripts/**", "src/scripts/**"],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    // Set globals for browser scripts (decoder files).
    files: ["**/decoder.js", "**/decoder.ts"],
    languageOptions: {
      globals: globals.browser,
    },
  },

  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: tseslint.parser,
        svelteConfig,
      },
    },
  },
);

export default config;
