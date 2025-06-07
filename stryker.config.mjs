// @ts-check
/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
const config = {
  mutate: ["apps/**/*.{ts,tsx}"], // TODO: more modules must be tested.
  packageManager: "pnpm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "vitest",
  coverageAnalysis: "perTest",
  plugins: [
    "@stryker-mutator/vitest-runner",
    "@stryker-mutator/typescript-checker",
  ],
  tempDirName: ".stryker-tmp",
  tsconfigFile: "tsconfig.json",
  checker: ["typescript"],
  typescriptChecker: {
    prioritizePerformanceOverAccuracy: true,
  },
  ignorePatterns: [".direnv/**", "**/*.nix", "result*", "stryker-tmp/**"],
};

export default config;
