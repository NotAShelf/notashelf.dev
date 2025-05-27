import eslint from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

const config = tseslint.config(
  // JavaScript
  eslint.configs.recommended,
  // TypeScript
  ...tseslint.configs.recommended,
  // Astro
  ...eslintPluginAstro.configs["flat/recommended"],

  {
    // Global config
    ignores: [
      "**/dist",
      "**/node_modules",
      "**/.astro",
      "**/.github",
      "**/result",
      "**/*.rs",
    ],
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
    files: ["src/scripts/**"],
    languageOptions: {
      globals: globals.node,
    },
  },
);

export default config;
