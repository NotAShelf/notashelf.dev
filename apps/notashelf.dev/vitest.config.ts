/// <reference types="vitest" />
import { getViteConfig } from "astro/config";
import path from "path";

export default getViteConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@layouts": path.resolve(__dirname, "./src/layouts"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@data": path.resolve(__dirname, "./src/data"),
      "@scripts": path.resolve(__dirname, "./src/scripts"),
      "wasm-utils": path.resolve(__dirname, "../../packages/wasm-utils/pkg"),
    },
  },

  // Force Vite pre-bundle the WASM utils
  optimizeDeps: {
    include: ["wasm-utils"],
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
