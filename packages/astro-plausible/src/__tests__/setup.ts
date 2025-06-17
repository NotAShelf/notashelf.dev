/**
 * Test setup for astro-plausible package
 *
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";

// Mock Node.js built-ins that might be used in the package
beforeAll(() => {
  // Setup any global test configuration
});

afterAll(() => {
  // Cleanup any global test resources
});

beforeEach(() => {
  // Reset any mocks or state before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

// Export test utilities
export const TEST_DOMAIN = "example.com";
export const TEST_DOMAIN_MULTIPLE = "example.com,app.example.com";
export const TEST_SRC = "https://analytics.example.com/js/script.js";
export const TEST_API_HOST = "https://analytics.example.com/api/event";

// Mock Astro logger for testing
export const mockAstroLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// Mock Astro integration context
export function createMockAstroContext() {
  return {
    logger: mockAstroLogger,
    command: "build" as const,
    injectScript: vi.fn(),
    config: {
      root: new URL("file:///mock/project/"),
      srcDir: new URL("file:///mock/project/src/"),
      publicDir: new URL("file:///mock/project/public/"),
    },
  };
}

// Mock script injection for testing
export const mockInjectScript = vi.fn();

// Helper to create complete mock Astro setup context
export function createMockSetupContext(command: "dev" | "build" = "build") {
  return {
    command,
    injectScript: mockInjectScript,
    logger: mockAstroLogger,
    config: {
      root: new URL("file:///mock/project/"),
      srcDir: new URL("file:///mock/project/src/"),
      publicDir: new URL("file:///mock/project/public/"),
    },
    isRestart: false,
    updateConfig: vi.fn(),
    addRenderer: vi.fn(),
    addWatchFile: vi.fn(),
    addClientDirective: vi.fn(),
    addMiddleware: vi.fn(),
    addDevToolbarApp: vi.fn(),
  } as any; // bypass strict typing for tests
}
