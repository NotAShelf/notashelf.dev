import { defineConfig, defineProject } from "vitest/config";
import * as path from "path";

const alias = (name: string) => {
  const find = `@notashelf.dev/${name}`;
  const replacement = path.join(__dirname, "packages", name, "src");
  return { find, replacement };
};

export const projectConfig = defineProject({
  test: {
    alias: [alias("notashelf.dev")],
  },
});

export default defineConfig({
  test: {
    globals: true,
    projects: [
      "./apps/notashelf.dev",
      "./packages/astro-email-obfuscation",
      "./packages/astro-purge-css",
      "./packages/remark-em-dash",
      "./packages/vite-copyright-replace",
    ],
    coverage: {
      exclude: [
        ".github",
        "packages/wasm-utils",
        "nix",
        "**/eslint.config.ts",
        "**/content.config.ts",
        "**/vitest.workspace.ts",
        "**/vitest.config.ts",
        "**/.astro/",
        "**/coverage/",
        "**/__tests__/**",
        "**/dist/**",
        "**/types.*.ts",
        "**/env.d.ts",
      ],
    },
  },
});
