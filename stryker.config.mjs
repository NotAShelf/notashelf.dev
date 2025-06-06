// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  mutate: ['apps/**/*.{ts,tsx}'], // TODO: more modules must be tested.
  packageManager: "pnpm",
  reporters: ["html", "clear-text", "progress", "dashboard"],
  testRunner: "vitest",
  coverageAnalysis: "perTest",
  plugins: ["@stryker-mutator/vitest-runner"],
  tempDirName: '.stryker-tmp',
  tsconfigFile: 'tsconfig.json',
  ignorePatterns: ['.direnv/**', "**/*.nix"],
};

export default config;
