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
        "nix",
        "scripts", // we don't really want to test those
        "packages/wasm-utils", // we can't actually test the output of this
        // Config files
        "**/*.config.{js, mjs, ts}",
        "**/vitest.workspace.ts",
        "**/coverage/",
        "**/.astro/",
        "**/__tests__/**",
        // Types etc.
        "**/dist/**",
        "**/types.*.ts",
        "**/*.d.ts",
      ],
    },
  },
});
