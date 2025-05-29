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
    coverage: {
      exclude: [
        ".github",
        "packages/wasm-utils",
        "nix",
        "**/vitest.workspace.ts",
        "**/vitest.config.ts",
        "**/.astro/",
        "**/coverage/",
        "**/__tests__/**",
        "**/dist/**",
        "**/types.*.ts",
      ],
    },
  },
});
