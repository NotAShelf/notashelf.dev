/// <reference types="vitest" />
import { getViteConfig } from "astro/config";
import path from "path";

const srcDir = path.resolve(import.meta.dirname, "src");
export default getViteConfig({
  resolve: {
    alias: {
      "@": srcDir,
      "@components": path.join(srcDir, "components"),
      "@layouts": path.join(srcDir, "layouts"),
      "@styles": path.join(srcDir, "styles"),
      "@lib": path.join(srcDir, "lib"),
      "@data": path.join(srcDir, "data"),
      "@scripts": path.join(srcDir, "scripts"),
    },
  },

  // @ts-expect-error: something about Vitest not being compatible. Blame Astro.
  test: {
    name: "notashelf.dev",
    environment: "happy-dom",
    globals: true,
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["node_modules", "dist"],
    pool: "forks",
    isolate: false,
    setupFiles: ["./src/__tests__/setup.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "astro.config.ts",
        "svlte.config.js",
        "node_modules/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        ".astro",
        "posts",
        "public",
        "src/styles",
        "src/data",
        "src/__tests__/", // no lets write tests for tests, lol
      ],
    },
  },
});
