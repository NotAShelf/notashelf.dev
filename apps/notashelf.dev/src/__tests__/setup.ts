/**
 * Vitest test harness for my Astro project
 * Configures the testing environment for DOM testing with happy-dom
 */

import { beforeAll, beforeEach, afterEach, vi } from "vitest";

// Mock window.scrollTo for smooth scrolling tests
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

Object.defineProperty(window, "IntersectionObserver", {
  value: mockIntersectionObserver,
  writable: true,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

// Mock console methods to avoid noise in tests
beforeAll(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset DOM
  document.body.innerHTML = "";
  document.head.innerHTML = "";
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});
