/**
 * Test setup for astro-email-obfuscation package
 *
 * This file configures the testing environment for the email obfuscation package.
 * It sets up any necessary globals, mocks, or test utilities.
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

// Export test utilities if needed
export const TEST_EMAIL = "test@example.com";
export const TEST_EMAIL_INVALID = "not-an-email";
export const TEST_EMAIL_XSS = 'test@example.com<script>alert("xss")</script>';

// Mock Astro logger for testing
export const mockAstroLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// Helper to create mock Astro integration context
export function createMockAstroContext() {
  return {
    logger: mockAstroLogger,
    dir: new URL("file:///mock/dist/"),
  };
}
